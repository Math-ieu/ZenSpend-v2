import json
import os
from dataclasses import dataclass
from typing import Dict
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from django.contrib.auth import get_user_model
from django.core import signing
from django.shortcuts import redirect
from django.urls import reverse
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken


User = get_user_model()


class SSOFlowError(Exception):
    pass


@dataclass
class SSOProviderConfig:
    name: str
    client_id: str
    client_secret: str
    authorize_url: str
    token_url: str
    userinfo_url: str
    scope: str


def _frontend_callback_url() -> str:
    return os.environ.get('SSO_FRONTEND_CALLBACK_URL', 'http://localhost:5173/auth/sso/callback')


def _state_max_age_seconds() -> int:
    return int(os.environ.get('SSO_STATE_MAX_AGE_SECONDS', '600'))


def _sanitize_next_path(next_value: str | None) -> str:
    if not next_value:
        return '/dashboard'

    parsed = urlparse(next_value)
    if parsed.scheme or parsed.netloc:
        return '/dashboard'

    path = parsed.path or '/dashboard'
    if not path.startswith('/'):
        return '/dashboard'

    if parsed.query:
        return f'{path}?{parsed.query}'

    return path


def _json_get(url: str, headers: Dict[str, str] | None = None) -> Dict:
    request = Request(url, headers=headers or {})

    try:
        with urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode('utf-8'))
    except (HTTPError, URLError, json.JSONDecodeError) as error:
        raise SSOFlowError(f'HTTP GET failed for {url}: {error}') from error


def _json_post_form(url: str, payload: Dict[str, str]) -> Dict:
    request = Request(
        url,
        data=urlencode(payload).encode('utf-8'),
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
    )

    try:
        with urlopen(request, timeout=15) as response:
            return json.loads(response.read().decode('utf-8'))
    except (HTTPError, URLError, json.JSONDecodeError) as error:
        raise SSOFlowError(f'HTTP POST failed for {url}: {error}') from error


def _provider_config(provider: str) -> SSOProviderConfig:
    microsoft_tenant = os.environ.get('SSO_MICROSOFT_TENANT', 'common')

    configs = {
        'google': SSOProviderConfig(
            name='google',
            client_id=os.environ.get('SSO_GOOGLE_CLIENT_ID', ''),
            client_secret=os.environ.get('SSO_GOOGLE_CLIENT_SECRET', ''),
            authorize_url='https://accounts.google.com/o/oauth2/v2/auth',
            token_url='https://oauth2.googleapis.com/token',
            userinfo_url='https://www.googleapis.com/oauth2/v2/userinfo',
            scope='openid email profile',
        ),
        'facebook': SSOProviderConfig(
            name='facebook',
            client_id=os.environ.get('SSO_FACEBOOK_CLIENT_ID', ''),
            client_secret=os.environ.get('SSO_FACEBOOK_CLIENT_SECRET', ''),
            authorize_url='https://www.facebook.com/v19.0/dialog/oauth',
            token_url='https://graph.facebook.com/v19.0/oauth/access_token',
            userinfo_url='https://graph.facebook.com/me',
            scope='email,public_profile',
        ),
        'microsoft': SSOProviderConfig(
            name='microsoft',
            client_id=os.environ.get('SSO_MICROSOFT_CLIENT_ID', ''),
            client_secret=os.environ.get('SSO_MICROSOFT_CLIENT_SECRET', ''),
            authorize_url=f'https://login.microsoftonline.com/{microsoft_tenant}/oauth2/v2.0/authorize',
            token_url=f'https://login.microsoftonline.com/{microsoft_tenant}/oauth2/v2.0/token',
            userinfo_url='https://graph.microsoft.com/v1.0/me',
            scope='openid profile email User.Read',
        ),
    }

    if provider not in configs:
        raise SSOFlowError('Unsupported SSO provider.')

    config = configs[provider]
    if not config.client_id or not config.client_secret:
        raise SSOFlowError(f'SSO provider {provider} is not configured.')

    return config


def _build_authorize_url(config: SSOProviderConfig, redirect_uri: str, state: str) -> str:
    base_params = {
        'client_id': config.client_id,
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': config.scope,
        'state': state,
    }

    if config.name == 'google':
        base_params['prompt'] = 'select_account'
    elif config.name == 'microsoft':
        base_params['response_mode'] = 'query'

    return f"{config.authorize_url}?{urlencode(base_params)}"


def _exchange_code_for_token(config: SSOProviderConfig, code: str, redirect_uri: str) -> Dict:
    if config.name == 'facebook':
        token_url = f"{config.token_url}?{urlencode({
            'client_id': config.client_id,
            'client_secret': config.client_secret,
            'redirect_uri': redirect_uri,
            'code': code,
        })}"
        return _json_get(token_url)

    return _json_post_form(
        config.token_url,
        {
            'client_id': config.client_id,
            'client_secret': config.client_secret,
            'code': code,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        },
    )


def _fetch_user_profile(config: SSOProviderConfig, access_token: str) -> Dict[str, str]:
    if config.name == 'google':
        payload = _json_get(
            f"{config.userinfo_url}?{urlencode({'access_token': access_token})}"
        )
        return {
            'email': payload.get('email', ''),
            'first_name': payload.get('given_name', ''),
            'last_name': payload.get('family_name', ''),
        }

    if config.name == 'facebook':
        payload = _json_get(
            f"{config.userinfo_url}?{urlencode({'fields': 'id,first_name,last_name,email', 'access_token': access_token})}"
        )
        fallback_email = f"{payload.get('id', 'facebook-user')}@facebook.local"
        return {
            'email': payload.get('email') or fallback_email,
            'first_name': payload.get('first_name', ''),
            'last_name': payload.get('last_name', ''),
        }

    payload = _json_get(
        config.userinfo_url,
        headers={
            'Authorization': f'Bearer {access_token}',
        },
    )
    return {
        'email': payload.get('mail') or payload.get('userPrincipalName', ''),
        'first_name': payload.get('givenName', ''),
        'last_name': payload.get('surname', ''),
    }


def _redirect_to_frontend_callback(**params):
    encoded = urlencode(params)
    return redirect(f'{_frontend_callback_url()}?{encoded}')


class SSOProviderStartView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, provider: str):
        try:
            config = _provider_config(provider)
            next_path = _sanitize_next_path(request.GET.get('next'))
            state = signing.dumps({'provider': provider, 'next': next_path})
            redirect_uri = request.build_absolute_uri(reverse('sso-callback', kwargs={'provider': provider}))
            authorize_url = _build_authorize_url(config, redirect_uri, state)
            return redirect(authorize_url)
        except SSOFlowError as error:
            return _redirect_to_frontend_callback(error=str(error))


class SSOProviderCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, provider: str):
        code = request.GET.get('code')
        state = request.GET.get('state')

        if not code or not state:
            return _redirect_to_frontend_callback(error='Missing code or state.')

        try:
            state_data = signing.loads(state, max_age=_state_max_age_seconds())
            expected_provider = state_data.get('provider')
            next_path = _sanitize_next_path(state_data.get('next'))

            if expected_provider != provider:
                raise SSOFlowError('Invalid state provider.')

            config = _provider_config(provider)
            redirect_uri = request.build_absolute_uri(reverse('sso-callback', kwargs={'provider': provider}))
            token_payload = _exchange_code_for_token(config, code, redirect_uri)
            access_token = token_payload.get('access_token')

            if not access_token:
                raise SSOFlowError('OAuth token exchange failed.')

            profile = _fetch_user_profile(config, access_token)
            email = (profile.get('email') or '').strip().lower()

            if not email:
                raise SSOFlowError('SSO provider did not return an email address.')

            first_name = (profile.get('first_name') or '').strip() or 'Utilisateur'
            last_name = (profile.get('last_name') or '').strip() or provider.capitalize()

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'phone_number': '',
                },
            )

            if not created:
                should_update = False
                if not user.first_name and first_name:
                    user.first_name = first_name
                    should_update = True
                if not user.last_name and last_name:
                    user.last_name = last_name
                    should_update = True
                if should_update:
                    user.save(update_fields=['first_name', 'last_name'])

            refresh = RefreshToken.for_user(user)
            return _redirect_to_frontend_callback(
                access=str(refresh.access_token),
                refresh=str(refresh),
                next=next_path,
            )
        except (SSOFlowError, signing.BadSignature, signing.SignatureExpired) as error:
            return _redirect_to_frontend_callback(error=str(error))
