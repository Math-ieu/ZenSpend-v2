import logging

from django.conf import settings
from django.core.mail import EmailMessage, send_mail


logger = logging.getLogger(__name__)


def _password_reset_email_text(reset_url):
    return (
        "Bonjour,\n\n"
        "Vous avez demande la reinitialisation de votre mot de passe ZenSpend.\n"
        f"Utilisez ce lien: {reset_url}\n\n"
        "Si vous n'etes pas a l'origine de cette demande, ignorez ce message."
    )


def _password_reset_email_html(reset_url):
    return (
        "<p>Bonjour,</p>"
        "<p>Vous avez demande la reinitialisation de votre mot de passe ZenSpend.</p>"
        f"<p>Utilisez ce lien: <a href=\"{reset_url}\">{reset_url}</a></p>"
        "<p>Si vous n'etes pas a l'origine de cette demande, ignorez ce message.</p>"
    )


def _send_with_django(recipient_email, subject, text_content, html_content):
    send_mail(
        subject,
        text_content,
        settings.DEFAULT_FROM_EMAIL,
        [recipient_email],
        html_message=html_content,
        fail_silently=False,
    )


def _send_with_resend(recipient_email, subject, text_content, html_content):
    try:
        import resend
    except ImportError as error:
        raise RuntimeError('The resend package is not installed.') from error

    if not settings.RESEND_API_KEY:
        raise RuntimeError('RESEND_API_KEY is missing.')

    resend.api_key = settings.RESEND_API_KEY
    payload = {
        'from': settings.RESEND_FROM_EMAIL,
        'to': [recipient_email],
        'subject': subject,
        'text': text_content,
        'html': html_content,
    }

    if settings.RESEND_REPLY_TO:
        payload['reply_to'] = settings.RESEND_REPLY_TO

    resend.Emails.send(payload)


def send_contact_email(name, sender_email, subject, message):
    """Forward a contact-form submission to the support inbox.

    Uses the configured Django email backend (console in development). The
    visitor's email is set as reply-to so support can answer directly.
    """
    recipient = getattr(settings, 'CONTACT_EMAIL', settings.DEFAULT_FROM_EMAIL)
    full_subject = f'[Contact ZenSpend] {subject}'
    body = (
        f'Nouveau message de contact\n\n'
        f'Nom: {name}\n'
        f'Email: {sender_email}\n'
        f'Sujet: {subject}\n\n'
        f'{message}\n'
    )
    try:
        email = EmailMessage(
            subject=full_subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient],
            reply_to=[sender_email] if sender_email else None,
        )
        email.send(fail_silently=False)
        return True
    except Exception:
        logger.exception('Contact email could not be sent from %s', sender_email)
        return False


def send_password_reset_email(recipient_email, reset_url):
    subject = settings.PASSWORD_RESET_EMAIL_SUBJECT
    text_content = _password_reset_email_text(reset_url)
    html_content = _password_reset_email_html(reset_url)
    provider = settings.PASSWORD_RESET_EMAIL_PROVIDER

    if provider not in ('resend', 'django'):
        logger.warning('Unknown password reset email provider "%s". Falling back to Django backend.', provider)
        provider = 'django'

    if provider == 'resend':
        try:
            _send_with_resend(recipient_email, subject, text_content, html_content)
            return
        except Exception as error:
            logger.warning(
                'Password reset email via Resend failed for %s: %s',
                recipient_email,
                error,
            )

            if not settings.PASSWORD_RESET_EMAIL_ALLOW_FALLBACK:
                return

            logger.warning('Falling back to Django email backend for password reset email.')

    try:
        _send_with_django(recipient_email, subject, text_content, html_content)
    except Exception:
        logger.exception('Password reset email could not be sent using Django backend for %s', recipient_email)