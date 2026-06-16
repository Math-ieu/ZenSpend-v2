from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import os
import secrets
import time
from typing import Dict, List, Optional

import requests


# Default base URL for the GoCardless Bank Account Data API (ex-Nordigen).
GOCARDLESS_DEFAULT_BASE_URL = "https://bankaccountdata.gocardless.com"
# Sandbox institution that returns mock accounts/transactions without a real
# bank login. Handy for a POC: set BANK_PROVIDER_INSTITUTION_ID to a real
# institution id (e.g. from GET /api/v2/institutions/?country=fr) for production.
GOCARDLESS_SANDBOX_INSTITUTION = "SANDBOXFINANCE_SFIN0000"

# Default base URL for the Enable Banking API (PSD2 / Open Banking aggregator).
ENABLEBANKING_DEFAULT_BASE_URL = "https://api.enablebanking.com"
# Enable Banking authenticates every request with an RS256 JWT signed by the
# application's private key; these are the fixed issuer/audience claims.
ENABLEBANKING_JWT_ISSUER = "enablebanking.com"
ENABLEBANKING_JWT_AUDIENCE = "api.enablebanking.com"
# Max DSP2 consent / access validity Enable Banking allows (days).
ENABLEBANKING_MAX_ACCESS_DAYS = 90


@dataclass(frozen=True)
class BankProviderConfig:
    provider: str
    base_url: str
    client_id: str
    client_secret: str
    institution_id: str = ""
    country: str = "fr"
    # Enable Banking only: PEM-encoded RSA private key (content or file path)
    # used to sign request JWTs. client_id holds the Application ID (JWT `kid`).
    private_key: str = ""
    private_key_path: str = ""

    @classmethod
    def from_env(cls) -> "BankProviderConfig":
        return cls(
            provider=os.environ.get("BANK_PROVIDER", "mock").strip().lower(),
            base_url=os.environ.get("BANK_PROVIDER_BASE_URL", "").strip(),
            client_id=os.environ.get("BANK_PROVIDER_CLIENT_ID", "").strip(),
            client_secret=os.environ.get("BANK_PROVIDER_CLIENT_SECRET", "").strip(),
            institution_id=os.environ.get("BANK_PROVIDER_INSTITUTION_ID", "").strip(),
            country=os.environ.get("BANK_PROVIDER_COUNTRY", "fr").strip().lower() or "fr",
            private_key=os.environ.get("BANK_PROVIDER_PRIVATE_KEY", "").strip(),
            private_key_path=os.environ.get("BANK_PROVIDER_PRIVATE_KEY_PATH", "").strip(),
        )

    def is_complete(self) -> bool:
        if self.provider == "mock":
            return True
        # GoCardless authenticates with secret_id / secret_key only; the API
        # base URL has a sensible default so it is not strictly required.
        if self.provider == "gocardless":
            return bool(self.client_id and self.client_secret)
        # Enable Banking needs the Application ID (client_id) plus a private key
        # (inline content or a file path) to sign request JWTs.
        if self.provider == "enablebanking":
            return bool(self.client_id and (self.private_key or self.private_key_path))
        return bool(self.base_url and self.client_id and self.client_secret)


class BankProviderError(Exception):
    pass


@dataclass
class BankLinkSession:
    session_id: str
    provider: str
    link_url: str
    expires_at: datetime
    state: str

    def to_dict(self) -> Dict[str, str]:
        return {
            "session_id": self.session_id,
            "provider": self.provider,
            "link_url": self.link_url,
            "expires_at": self.expires_at.isoformat(),
            "state": self.state,
        }


class BaseBankProviderClient:
    def __init__(self, config: BankProviderConfig):
        self.config = config

    @property
    def provider_name(self) -> str:
        return self.config.provider

    @property
    def is_configured(self) -> bool:
        return self.config.is_complete()

    def healthcheck(self) -> Dict[str, object]:
        return {
            "provider": self.provider_name,
            "configured": self.is_configured,
            "base_url_present": bool(self.config.base_url),
            "client_id_present": bool(self.config.client_id),
            "client_secret_present": bool(self.config.client_secret),
        }

    def create_link_session(self, redirect_uri: Optional[str], state: Optional[str] = None) -> BankLinkSession:
        raise NotImplementedError

    def fetch_connection_accounts(self, external_connection_id: str) -> List[Dict[str, str]]:
        """Return account descriptors for a connection (shaped for BankCallbackView).

        Default: no accounts. Providers that can list accounts server-side
        override this so the callback does not depend on the client passing them.
        """
        return []

    def fetch_connection_transactions(self, external_connection_id: str) -> List[Dict[str, str]]:
        raise NotImplementedError


class MockBankProviderClient(BaseBankProviderClient):
    def create_link_session(self, redirect_uri: Optional[str], state: Optional[str] = None) -> BankLinkSession:
        session_id = f"mock_{secrets.token_hex(8)}"
        state_token = state or secrets.token_urlsafe(24)
        callback_uri = redirect_uri or "https://example.com/zenspend/callback"
        link_url = (
            f"{callback_uri}?mock_bank_link=1"
            f"&session_id={session_id}"
            f"&provider={self.provider_name}"
            f"&state={state_token}"
        )

        return BankLinkSession(
            session_id=session_id,
            provider=self.provider_name,
            link_url=link_url,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
            state=state_token,
        )

    def fetch_connection_accounts(self, external_connection_id: str) -> List[Dict[str, str]]:
        # Single demo account whose external id matches the mock transactions
        # below, so synced transactions resolve onto it.
        return [
            {
                'external_account_id': f"{external_connection_id}_main",
                'name': 'Compte principal',
                'account_type': 'checking',
                'currency': 'EUR',
                'balance': '1500.00',
                'account_number': '',
            }
        ]

    def fetch_connection_transactions(self, external_connection_id: str) -> List[Dict[str, str]]:
        account_external_id = f"{external_connection_id}_main"

        return [
            {
                'id': f"{external_connection_id}_salary",
                'account_external_id': account_external_id,
                'amount': str(Decimal('2650.00')),
                'description': 'Salaire',
                'date': '2026-04-13T09:00:00+00:00',
                'payee': 'Employeur',
                'status': 'cleared',
                'notes': '',
            },
            {
                'id': f"{external_connection_id}_groceries",
                'account_external_id': account_external_id,
                'amount': str(Decimal('-64.90')),
                'description': 'Courses',
                'date': '2026-04-14T18:20:00+00:00',
                'payee': 'Supermarche',
                'status': 'cleared',
                'notes': '',
            },
            {
                'id': f"{external_connection_id}_transport",
                'account_external_id': account_external_id,
                'amount': str(Decimal('-18.40')),
                'description': 'Transport',
                'date': '2026-04-15T07:45:00+00:00',
                'payee': 'RATP',
                'status': 'cleared',
                'notes': '',
            },
        ]


class GenericConfiguredBankProviderClient(BaseBankProviderClient):
    def create_link_session(self, redirect_uri: Optional[str], state: Optional[str] = None) -> BankLinkSession:
        if not self.is_configured:
            raise BankProviderError("Bank provider is not configured.")

        session_id = f"{self.provider_name}_{secrets.token_hex(8)}"
        state_token = state or secrets.token_urlsafe(24)
        safe_base_url = self.config.base_url.rstrip("/")
        link_url = (
            f"{safe_base_url}/connect"
            f"?client_id={self.config.client_id}"
            f"&session_id={session_id}"
            f"&state={state_token}"
        )

        if redirect_uri:
            link_url += f"&redirect_uri={redirect_uri}"

        return BankLinkSession(
            session_id=session_id,
            provider=self.provider_name,
            link_url=link_url,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
            state=state_token,
        )

    def fetch_connection_transactions(self, external_connection_id: str) -> List[Dict[str, str]]:
        raise BankProviderError(
            f"Provider transaction sync is not implemented for '{self.provider_name}'."
        )


class GoCardlessBankProviderClient(BaseBankProviderClient):
    """Client for the GoCardless Bank Account Data API (ex-Nordigen).

    Flow (PSD2 / Open Banking):
      1. POST /api/v2/token/new/        -> access token (from secret_id/secret_key)
      2. POST /api/v2/requisitions/     -> requisition id + hosted consent link
      3. (user consents at the bank, then is redirected back)
      4. GET  /api/v2/requisitions/{id}/                  -> list of account ids
      5. GET  /api/v2/accounts/{id}/transactions/         -> booked + pending tx

    The requisition id is used as ``external_connection_id`` so it maps cleanly
    onto the existing BankConnection model.
    """

    REQUEST_TIMEOUT = 30

    def __init__(self, config: BankProviderConfig):
        super().__init__(config)
        self._base_url = (config.base_url or GOCARDLESS_DEFAULT_BASE_URL).rstrip("/")
        self._access_token: Optional[str] = None
        self._session = requests.Session()

    # -- HTTP helpers -----------------------------------------------------
    def _url(self, path: str) -> str:
        return f"{self._base_url}/api/v2/{path.lstrip('/')}"

    def _get_access_token(self) -> str:
        if self._access_token:
            return self._access_token

        if not self.is_configured:
            raise BankProviderError("GoCardless provider is not configured.")

        try:
            response = self._session.post(
                self._url("token/new/"),
                json={
                    "secret_id": self.config.client_id,
                    "secret_key": self.config.client_secret,
                },
                timeout=self.REQUEST_TIMEOUT,
            )
        except requests.RequestException as exc:
            raise BankProviderError(f"GoCardless token request failed: {exc}") from exc

        if response.status_code >= 400:
            raise BankProviderError(
                f"GoCardless token request rejected ({response.status_code}): {response.text[:300]}"
            )

        access = response.json().get("access")
        if not access:
            raise BankProviderError("GoCardless token response did not contain an access token.")

        self._access_token = access
        return access

    def _auth_headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self._get_access_token()}"}

    def _get(self, path: str) -> Dict[str, object]:
        try:
            response = self._session.get(
                self._url(path), headers=self._auth_headers(), timeout=self.REQUEST_TIMEOUT
            )
        except requests.RequestException as exc:
            raise BankProviderError(f"GoCardless GET {path} failed: {exc}") from exc

        if response.status_code >= 400:
            raise BankProviderError(
                f"GoCardless GET {path} rejected ({response.status_code}): {response.text[:300]}"
            )
        return response.json()

    # -- Provider interface ----------------------------------------------
    def create_link_session(self, redirect_uri: Optional[str], state: Optional[str] = None) -> BankLinkSession:
        institution_id = self.config.institution_id or GOCARDLESS_SANDBOX_INSTITUTION
        state_token = state or secrets.token_urlsafe(24)
        callback_uri = redirect_uri or "https://example.com/zenspend/callback"

        try:
            response = self._session.post(
                self._url("requisitions/"),
                headers=self._auth_headers(),
                json={
                    "redirect": callback_uri,
                    "institution_id": institution_id,
                    "reference": state_token,
                    "user_language": self.config.country.upper(),
                },
                timeout=self.REQUEST_TIMEOUT,
            )
        except requests.RequestException as exc:
            raise BankProviderError(f"GoCardless requisition request failed: {exc}") from exc

        if response.status_code >= 400:
            raise BankProviderError(
                f"GoCardless requisition rejected ({response.status_code}): {response.text[:300]}"
            )

        data = response.json()
        requisition_id = data.get("id")
        link_url = data.get("link")
        if not requisition_id or not link_url:
            raise BankProviderError("GoCardless requisition response was incomplete.")

        return BankLinkSession(
            session_id=requisition_id,
            provider=self.provider_name,
            link_url=link_url,
            # GoCardless consent links are valid for a few minutes; surface a
            # conservative expiry so the frontend can prompt a fresh link.
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
            state=state_token,
        )

    def fetch_connection_accounts(self, external_connection_id: str) -> List[Dict[str, str]]:
        """Return account descriptors for a requisition, shaped for BankCallbackView."""
        requisition = self._get(f"requisitions/{external_connection_id}/")
        account_ids = requisition.get("accounts") or []

        accounts: List[Dict[str, str]] = []
        for account_id in account_ids:
            metadata = self._get(f"accounts/{account_id}/")
            try:
                details = self._get(f"accounts/{account_id}/details/").get("account", {})
            except BankProviderError:
                details = {}
            try:
                balances = self._get(f"accounts/{account_id}/balances/").get("balances", [])
            except BankProviderError:
                balances = []

            balance_amount = "0"
            if balances:
                balance_amount = balances[0].get("balanceAmount", {}).get("amount", "0")

            accounts.append(
                {
                    "external_account_id": account_id,
                    "name": details.get("name") or details.get("product") or metadata.get("iban") or account_id,
                    "account_type": "checking",
                    "currency": details.get("currency") or "EUR",
                    "balance": balance_amount,
                    "account_number": metadata.get("iban", "") or "",
                }
            )
        return accounts

    def fetch_connection_transactions(self, external_connection_id: str) -> List[Dict[str, str]]:
        requisition = self._get(f"requisitions/{external_connection_id}/")
        account_ids = requisition.get("accounts") or []

        normalized: List[Dict[str, str]] = []
        for account_id in account_ids:
            payload = self._get(f"accounts/{account_id}/transactions/")
            buckets = payload.get("transactions", {}) or {}
            for raw in buckets.get("booked", []) or []:
                normalized.append(self._normalize_transaction(raw, account_id, "cleared"))
            for raw in buckets.get("pending", []) or []:
                normalized.append(self._normalize_transaction(raw, account_id, "pending"))
        return normalized

    @staticmethod
    def _normalize_transaction(raw: Dict[str, object], account_id: str, status: str) -> Dict[str, str]:
        amount_block = raw.get("transactionAmount", {}) or {}
        external_id = (
            raw.get("transactionId")
            or raw.get("internalTransactionId")
            or f"{account_id}_{secrets.token_hex(8)}"
        )

        description = raw.get("remittanceInformationUnstructured", "")
        if not description:
            parts = raw.get("remittanceInformationUnstructuredArray") or []
            description = " ".join(str(p) for p in parts)

        payee = raw.get("creditorName") or raw.get("debtorName") or ""

        # GoCardless dates are 'YYYY-MM-DD'; expose an ISO datetime so the
        # sync layer's parse_datetime accepts them.
        raw_date = raw.get("bookingDate") or raw.get("valueDate") or ""
        date_iso = f"{raw_date}T00:00:00+00:00" if raw_date else None

        return {
            "id": str(external_id),
            "account_external_id": account_id,
            "account_name": "",
            "amount": str(amount_block.get("amount", "0")),
            "description": str(description)[:200],
            "date": date_iso,
            "payee": str(payee)[:100],
            "status": status,
            "notes": "",
        }


class EnableBankingBankProviderClient(BaseBankProviderClient):
    """Client for the Enable Banking API (PSD2 / Open Banking, AIS read-only).

    A close substitute for GoCardless/Nordigen with self-service signup. Key
    differences handled here:

    * Auth is a per-request **RS256 JWT** signed with the application's private
      key (no token-exchange endpoint). ``client_id`` is the Application ID
      surfaced as the JWT ``kid``.
    * The durable connection handle (``session_id``) only exists *after* the
      user consents: ``create_link_session`` starts an authorization and returns
      the hosted consent URL; once the bank redirects back with a ``code`` you
      call ``create_session(code)`` to obtain the ``session_id`` used as
      ``external_connection_id``.

    Flow:
      1. POST /auth        -> {url, authorization_id}  (hosted consent link)
      2. (user consents at the bank, redirected back with ?code=...&state=...)
      3. POST /sessions    -> {session_id, accounts:[{uid,...}]}
      4. GET  /sessions/{session_id}                   -> account uids
      5. GET  /accounts/{uid}/balances
      6. GET  /accounts/{uid}/transactions             -> booked + pending tx
    """

    REQUEST_TIMEOUT = 30
    # Re-sign a fresh JWT well before its 1h expiry to avoid clock-skew 401s.
    JWT_TTL_SECONDS = 3600
    JWT_REFRESH_MARGIN = 120

    def __init__(self, config: BankProviderConfig):
        super().__init__(config)
        self._base_url = (config.base_url or ENABLEBANKING_DEFAULT_BASE_URL).rstrip("/")
        self._session = requests.Session()
        self._token: Optional[str] = None
        self._token_exp: float = 0.0

    # -- HTTP / auth helpers ---------------------------------------------
    def _url(self, path: str) -> str:
        return f"{self._base_url}/{path.lstrip('/')}"

    def _load_private_key(self) -> str:
        if self.config.private_key:
            return self.config.private_key
        if self.config.private_key_path:
            try:
                with open(self.config.private_key_path, "r", encoding="utf-8") as handle:
                    return handle.read()
            except OSError as exc:
                raise BankProviderError(
                    f"Enable Banking private key file could not be read: {exc}"
                ) from exc
        raise BankProviderError("Enable Banking private key is not configured.")

    def _jwt_token(self) -> str:
        now = time.time()
        if self._token and (self._token_exp - self.JWT_REFRESH_MARGIN) > now:
            return self._token

        if not self.is_configured:
            raise BankProviderError("Enable Banking provider is not configured.")

        try:
            import jwt  # PyJWT; RS256 signing requires the `cryptography` extra.
        except ImportError as exc:  # pragma: no cover - dependency guard
            raise BankProviderError(
                "PyJWT is required to sign Enable Banking requests."
            ) from exc

        exp = int(now) + self.JWT_TTL_SECONDS
        try:
            token = jwt.encode(
                {
                    "iss": ENABLEBANKING_JWT_ISSUER,
                    "aud": ENABLEBANKING_JWT_AUDIENCE,
                    "iat": int(now),
                    "exp": exp,
                },
                self._load_private_key(),
                algorithm="RS256",
                headers={"kid": self.config.client_id},
            )
        except Exception as exc:  # pragma: no cover - surfaced as provider error
            raise BankProviderError(f"Enable Banking JWT signing failed: {exc}") from exc

        self._token = token
        self._token_exp = float(exp)
        return token

    def _auth_headers(self) -> Dict[str, str]:
        return {"Authorization": f"Bearer {self._jwt_token()}"}

    def _request(self, method: str, path: str, json_body: Optional[Dict] = None) -> Dict[str, object]:
        try:
            response = self._session.request(
                method,
                self._url(path),
                headers=self._auth_headers(),
                json=json_body,
                timeout=self.REQUEST_TIMEOUT,
            )
        except requests.RequestException as exc:
            raise BankProviderError(f"Enable Banking {method} {path} failed: {exc}") from exc

        if response.status_code >= 400:
            raise BankProviderError(
                f"Enable Banking {method} {path} rejected "
                f"({response.status_code}): {response.text[:300]}"
            )
        return response.json()

    def _get(self, path: str) -> Dict[str, object]:
        return self._request("GET", path)

    def _post(self, path: str, json_body: Dict) -> Dict[str, object]:
        return self._request("POST", path, json_body)

    # -- Discovery -------------------------------------------------------
    def list_aspsps(self, country: Optional[str] = None) -> List[Dict[str, object]]:
        """Return the available banks (ASPSPs); used to pick an institution id."""
        suffix = f"?country={(country or self.config.country).upper()}" if (country or self.config.country) else ""
        payload = self._get(f"aspsps{suffix}")
        return payload.get("aspsps", []) or []

    # -- Provider interface ----------------------------------------------
    def create_link_session(self, redirect_uri: Optional[str], state: Optional[str] = None) -> BankLinkSession:
        if not self.is_configured:
            raise BankProviderError("Enable Banking provider is not configured.")

        aspsp_name = self.config.institution_id
        if not aspsp_name:
            raise BankProviderError(
                "Enable Banking requires BANK_PROVIDER_INSTITUTION_ID (an ASPSP name "
                "from GET /aspsps, e.g. a sandbox bank)."
            )

        state_token = state or secrets.token_urlsafe(24)
        callback_uri = redirect_uri or "https://example.com/zenspend/callback"
        valid_until = (
            datetime.now(timezone.utc) + timedelta(days=ENABLEBANKING_MAX_ACCESS_DAYS)
        ).replace(microsecond=0)

        data = self._post(
            "auth",
            {
                "access": {"valid_until": valid_until.isoformat()},
                "aspsp": {"name": aspsp_name, "country": self.config.country.upper()},
                "state": state_token,
                "redirect_url": callback_uri,
                "psu_type": "personal",
            },
        )

        link_url = data.get("url")
        authorization_id = data.get("authorization_id")
        if not link_url:
            raise BankProviderError("Enable Banking auth response did not contain a consent URL.")

        return BankLinkSession(
            # NB: this is the authorization id, NOT the connection id. The durable
            # external_connection_id (session_id) comes from create_session(code)
            # after the user consents and is redirected back.
            session_id=str(authorization_id or state_token),
            provider=self.provider_name,
            link_url=str(link_url),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
            state=state_token,
        )

    def create_session(self, code: str) -> Dict[str, object]:
        """Exchange the redirect ``code`` for a session.

        Returns the raw session payload; ``session_id`` is the durable handle to
        store as ``external_connection_id``.
        """
        if not code:
            raise BankProviderError("Enable Banking session exchange requires a code.")
        return self._post("sessions", {"code": code})

    def _session_account_uids(self, session_id: str) -> List[str]:
        session = self._get(f"sessions/{session_id}")
        uids: List[str] = []
        for account in session.get("accounts", []) or []:
            if isinstance(account, dict):
                uid = account.get("uid")
                if uid:
                    uids.append(str(uid))
            elif account:
                uids.append(str(account))
        return uids

    def fetch_connection_accounts(self, external_connection_id: str) -> List[Dict[str, str]]:
        """Return account descriptors for a session, shaped for BankCallbackView."""
        session = self._get(f"sessions/{external_connection_id}")
        accounts: List[Dict[str, str]] = []

        for account in session.get("accounts", []) or []:
            if not isinstance(account, dict):
                account = {"uid": account}
            uid = str(account.get("uid", ""))
            if not uid:
                continue

            account_id = account.get("account_id") or {}
            iban = account_id.get("iban", "") if isinstance(account_id, dict) else ""

            balance_amount = "0"
            currency = account.get("currency") or "EUR"
            try:
                balances = self._get(f"accounts/{uid}/balances").get("balances", []) or []
            except BankProviderError:
                balances = []
            if balances:
                amount_block = balances[0].get("balance_amount", {}) or {}
                balance_amount = str(amount_block.get("amount", "0"))
                currency = amount_block.get("currency") or currency

            accounts.append(
                {
                    "external_account_id": uid,
                    "name": account.get("name") or account.get("product") or iban or uid,
                    "account_type": "checking",
                    "currency": currency,
                    "balance": balance_amount,
                    "account_number": iban,
                }
            )
        return accounts

    def fetch_connection_transactions(self, external_connection_id: str) -> List[Dict[str, str]]:
        normalized: List[Dict[str, str]] = []
        for uid in self._session_account_uids(external_connection_id):
            continuation_key: Optional[str] = None
            while True:
                path = f"accounts/{uid}/transactions"
                if continuation_key:
                    path += f"?continuation_key={continuation_key}"
                payload = self._get(path)
                for raw in payload.get("transactions", []) or []:
                    normalized.append(self._normalize_transaction(raw, uid))
                continuation_key = payload.get("continuation_key")
                if not continuation_key:
                    break
        return normalized

    @staticmethod
    def _normalize_transaction(raw: Dict[str, object], account_uid: str) -> Dict[str, str]:
        amount_block = raw.get("transaction_amount", {}) or {}
        # Enable Banking amounts are unsigned; direction comes from the indicator.
        amount = str(amount_block.get("amount", "0"))
        if str(raw.get("credit_debit_indicator", "")).upper() == "DBIT" and not amount.startswith("-"):
            amount = f"-{amount}"

        status = "pending" if str(raw.get("status", "")).upper() == "PDNG" else "cleared"

        external_id = (
            raw.get("entry_reference")
            or raw.get("transaction_id")
            or f"{account_uid}_{secrets.token_hex(8)}"
        )

        remittance = raw.get("remittance_information") or []
        if isinstance(remittance, str):
            description = remittance
        else:
            description = " ".join(str(p) for p in remittance)

        creditor = raw.get("creditor") or {}
        debtor = raw.get("debtor") or {}
        payee = ""
        if isinstance(creditor, dict):
            payee = creditor.get("name", "") or payee
        if not payee and isinstance(debtor, dict):
            payee = debtor.get("name", "")

        # Enable Banking dates are 'YYYY-MM-DD'; expose an ISO datetime so the
        # sync layer's parse_datetime accepts them.
        raw_date = raw.get("booking_date") or raw.get("value_date") or raw.get("transaction_date") or ""
        date_iso = f"{raw_date}T00:00:00+00:00" if raw_date else None

        return {
            "id": str(external_id),
            "account_external_id": account_uid,
            "account_name": "",
            "amount": amount,
            "description": str(description)[:200],
            "date": date_iso,
            "payee": str(payee)[:100],
            "status": status,
            "notes": "",
        }


def get_bank_provider_client() -> BaseBankProviderClient:
    config = BankProviderConfig.from_env()

    if config.provider == "mock":
        return MockBankProviderClient(config)

    if config.provider == "gocardless":
        return GoCardlessBankProviderClient(config)

    if config.provider == "enablebanking":
        return EnableBankingBankProviderClient(config)

    return GenericConfiguredBankProviderClient(config)
