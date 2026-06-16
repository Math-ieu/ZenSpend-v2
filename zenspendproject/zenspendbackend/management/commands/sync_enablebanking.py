"""POC de synchronisation bancaire via l'API Enable Banking (PSD2 / AIS).

Déroule le flux Open Banking depuis le terminal, sans frontend :

  1. --list-aspsps : liste les banques (ASPSP) disponibles pour le pays, afin
                     de choisir la valeur de BANK_PROVIDER_INSTITUTION_ID
                     (ex. une banque sandbox pour tester sans login réel).
  2. --link        : démarre une autorisation et affiche le lien de consentement
                     à ouvrir dans un navigateur. Après consentement, la banque
                     redirige vers le redirect_url avec un paramètre ?code=...
  3. --sync --code : échange le code contre une session, enregistre la connexion
                     + les comptes, récupère les transactions et les importe
                     (déduplication incluse) dans ZenSpend.

Différence clé avec GoCardless : l'identifiant de connexion durable
(session_id) n'existe qu'APRÈS le consentement, via l'échange du code.

Prérequis (.env) :
    BANK_PROVIDER=enablebanking
    BANK_PROVIDER_CLIENT_ID=<Application ID>
    BANK_PROVIDER_PRIVATE_KEY_PATH=/chemin/vers/private_key.pem   # ou _PRIVATE_KEY
    BANK_PROVIDER_INSTITUTION_ID=<nom d'ASPSP>   # cf. --list-aspsps
    BANK_PROVIDER_COUNTRY=fr

Exemples :
    python manage.py sync_enablebanking --list-aspsps
    python manage.py sync_enablebanking --email user@zenspend.local --link
    python manage.py sync_enablebanking --email user@zenspend.local --sync --code <code>
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.utils import timezone

from zenspendbackend.models import BankAccount, BankConnection
from zenspendbackend.services import (
    BankProviderError,
    get_bank_provider_client,
    sync_transactions_for_connection,
)

User = get_user_model()

PROVIDER = 'enablebanking'


class Command(BaseCommand):
    help = "POC : démarre un consentement Enable Banking puis synchronise les transactions."

    def add_arguments(self, parser):
        parser.add_argument('--email', help="Email de l'utilisateur ZenSpend cible (requis sauf --list-aspsps).")
        parser.add_argument('--list-aspsps', action='store_true', help="Liste les banques (ASPSP) disponibles pour le pays.")
        parser.add_argument('--link', action='store_true', help="Démarre une autorisation et affiche le lien de consentement.")
        parser.add_argument('--sync', action='store_true', help="Échange le code de redirection, importe comptes + transactions.")
        parser.add_argument('--code', help="Code reçu sur le redirect_url après consentement (requis avec --sync).")
        parser.add_argument('--redirect', help="Redirect URI après consentement (défaut: callback d'exemple).")

    def handle(self, *args, **options):
        client = get_bank_provider_client()
        if client.provider_name != PROVIDER:
            raise CommandError(
                f"BANK_PROVIDER doit valoir '{PROVIDER}' (actuel: '{client.provider_name}')."
            )
        if not client.is_configured:
            raise CommandError(
                "Enable Banking non configuré : renseigner CLIENT_ID (Application ID) "
                "et BANK_PROVIDER_PRIVATE_KEY[_PATH]."
            )

        if options['list_aspsps']:
            self._do_list_aspsps(client)
            return

        if not options.get('email'):
            raise CommandError("--email est requis (sauf avec --list-aspsps).")
        try:
            user = User.objects.get(email=options['email'])
        except User.DoesNotExist:
            raise CommandError(f"Utilisateur introuvable : {options['email']}")

        if options['link']:
            self._do_link(client, options.get('redirect'))
        elif options['sync']:
            code = options.get('code')
            if not code:
                raise CommandError("--sync requiert --code <code> (reçu sur le redirect_url).")
            self._do_sync(client, user, code)
        else:
            raise CommandError("Préciser --list-aspsps, --link ou --sync.")

    def _do_list_aspsps(self, client):
        try:
            aspsps = client.list_aspsps()
        except BankProviderError as exc:
            raise CommandError(str(exc))

        self.stdout.write(self.style.SUCCESS(f"ASPSP disponibles : {len(aspsps)}"))
        for aspsp in aspsps:
            name = aspsp.get('name', '?')
            country = aspsp.get('country', '?')
            self.stdout.write(f"  - {name} ({country})")
        self.stdout.write("\nRenseigner BANK_PROVIDER_INSTITUTION_ID avec le 'name' choisi.")

    def _do_link(self, client, redirect):
        try:
            session = client.create_link_session(redirect_uri=redirect, state=None)
        except BankProviderError as exc:
            raise CommandError(str(exc))

        self.stdout.write(self.style.SUCCESS("Autorisation créée."))
        self.stdout.write(f"  authorization_id : {session.session_id}")
        self.stdout.write(f"  lien consentement : {session.link_url}")
        self.stdout.write(
            "\nOuvrir le lien, donner le consentement. La banque redirige vers le "
            "redirect_url avec ?code=<code>. Relancer ensuite avec :\n"
            "  --sync --code <code>"
        )

    @staticmethod
    def _find_account(user, external_account_id):
        """Retrouve un BankAccount par son id externe sans lookup JSON (SQLite-safe)."""
        for account in BankAccount.objects.filter(user=user):
            details = account.connection_details or {}
            if details.get('provider') == PROVIDER and details.get('external_account_id') == external_account_id:
                return account
        return None

    def _do_sync(self, client, user, code):
        # 1. Échanger le code contre une session (identifiant de connexion durable).
        try:
            session = client.create_session(code)
        except BankProviderError as exc:
            raise CommandError(str(exc))

        session_id = session.get('session_id')
        if not session_id:
            raise CommandError("Réponse Enable Banking sans session_id.")
        self.stdout.write(f"Session créée : {session_id}")

        # 2. Enregistrer / mettre à jour la connexion bancaire.
        connection, _ = BankConnection.objects.update_or_create(
            user=user,
            provider=PROVIDER,
            external_connection_id=session_id,
            defaults={'status': 'connected'},
        )

        # 3. Découvrir et upserter les comptes (nécessaire pour rattacher les tx).
        try:
            accounts = client.fetch_connection_accounts(session_id)
        except BankProviderError as exc:
            raise CommandError(str(exc))

        for acc in accounts:
            existing = self._find_account(user, acc['external_account_id'])
            fields = {
                'user': user,
                'name': acc['name'],
                'account_number': acc.get('account_number', ''),
                'balance': acc.get('balance', 0),
                'currency': acc.get('currency', 'EUR'),
                'account_type': acc.get('account_type', 'checking'),
                'institution': connection.institution_name,
                'last_sync': timezone.now(),
                'connection_details': {
                    'provider': PROVIDER,
                    'external_account_id': acc['external_account_id'],
                    'external_connection_id': session_id,
                },
            }
            if existing is None:
                BankAccount.objects.create(**fields)
            else:
                for field, value in fields.items():
                    setattr(existing, field, value)
                existing.save()
        self.stdout.write(f"Comptes synchronisés : {len(accounts)}")

        # 4. Récupérer et importer les transactions.
        try:
            transactions = client.fetch_connection_transactions(session_id)
        except BankProviderError as exc:
            raise CommandError(str(exc))

        result = sync_transactions_for_connection(connection=connection, transactions=transactions)
        self.stdout.write(self.style.SUCCESS(
            f"Transactions récupérées : {len(transactions)} | "
            f"créées {result.created}, mises à jour {result.updated}, "
            f"doublons {result.duplicates}, ignorées {result.skipped}"
        ))
