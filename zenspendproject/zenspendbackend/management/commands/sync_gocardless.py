"""POC de synchronisation bancaire via GoCardless Bank Account Data API.

Déroule le flux Open Banking (PSD2) depuis le terminal, sans frontend :

  1. --link    : crée une requisition et affiche le lien de consentement à
                 ouvrir dans un navigateur (sandbox par défaut, aucun login
                 réel requis). Note l'identifiant de requisition affiché.
  2. --sync    : une fois le consentement donné, enregistre la connexion +
                 les comptes pour l'utilisateur, récupère les transactions et
                 les importe (déduplication incluse) dans ZenSpend.

Prérequis (.env) :
    BANK_PROVIDER=gocardless
    BANK_PROVIDER_CLIENT_ID=<secret_id>
    BANK_PROVIDER_CLIENT_SECRET=<secret_key>
    # optionnel : BANK_PROVIDER_INSTITUTION_ID, BANK_PROVIDER_COUNTRY

Exemples :
    python manage.py sync_gocardless --email user@zenspend.local --link
    python manage.py sync_gocardless --email user@zenspend.local --sync --requisition <id>
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


class Command(BaseCommand):
    help = "POC : crée un lien de consentement GoCardless puis synchronise les transactions."

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True, help="Email de l'utilisateur ZenSpend cible.")
        parser.add_argument('--link', action='store_true', help="Crée une requisition et affiche le lien de consentement.")
        parser.add_argument('--sync', action='store_true', help="Synchronise les comptes/transactions d'une requisition consentie.")
        parser.add_argument('--requisition', help="Identifiant de requisition (requis avec --sync).")
        parser.add_argument('--redirect', help="Redirect URI après consentement (défaut: callback d'exemple).")

    def handle(self, *args, **options):
        client = get_bank_provider_client()
        if client.provider_name != 'gocardless':
            raise CommandError(
                f"BANK_PROVIDER doit valoir 'gocardless' (actuel: '{client.provider_name}')."
            )
        if not client.is_configured:
            raise CommandError("GoCardless non configuré : renseigner CLIENT_ID/CLIENT_SECRET.")

        try:
            user = User.objects.get(email=options['email'])
        except User.DoesNotExist:
            raise CommandError(f"Utilisateur introuvable : {options['email']}")

        if options['link']:
            self._do_link(client, options.get('redirect'))
        elif options['sync']:
            requisition_id = options.get('requisition')
            if not requisition_id:
                raise CommandError("--sync requiert --requisition <id>.")
            self._do_sync(client, user, requisition_id)
        else:
            raise CommandError("Préciser --link ou --sync.")

    def _do_link(self, client, redirect):
        try:
            session = client.create_link_session(redirect_uri=redirect, state=None)
        except BankProviderError as exc:
            raise CommandError(str(exc))

        self.stdout.write(self.style.SUCCESS("Requisition créée."))
        self.stdout.write(f"  requisition_id : {session.session_id}")
        self.stdout.write(f"  lien consentement : {session.link_url}")
        self.stdout.write(
            "\nOuvrir le lien, donner le consentement, puis relancer avec :\n"
            f"  --sync --requisition {session.session_id}"
        )

    @staticmethod
    def _find_account(user, external_account_id):
        """Retrouve un BankAccount par son id externe sans lookup JSON (SQLite-safe)."""
        for account in BankAccount.objects.filter(user=user):
            details = account.connection_details or {}
            if details.get('provider') == 'gocardless' and details.get('external_account_id') == external_account_id:
                return account
        return None

    def _do_sync(self, client, user, requisition_id):
        # 1. Enregistrer / mettre à jour la connexion bancaire.
        connection, _ = BankConnection.objects.update_or_create(
            user=user,
            provider='gocardless',
            external_connection_id=requisition_id,
            defaults={'status': 'connected'},
        )

        # 2. Découvrir et upserter les comptes (nécessaire pour rattacher les tx).
        try:
            accounts = client.fetch_connection_accounts(requisition_id)
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
                    'provider': 'gocardless',
                    'external_account_id': acc['external_account_id'],
                    'external_connection_id': requisition_id,
                },
            }
            if existing is None:
                BankAccount.objects.create(**fields)
            else:
                for field, value in fields.items():
                    setattr(existing, field, value)
                existing.save()
        self.stdout.write(f"Comptes synchronisés : {len(accounts)}")

        # 3. Récupérer et importer les transactions.
        try:
            transactions = client.fetch_connection_transactions(requisition_id)
        except BankProviderError as exc:
            raise CommandError(str(exc))

        result = sync_transactions_for_connection(connection=connection, transactions=transactions)
        self.stdout.write(self.style.SUCCESS(
            f"Transactions récupérées : {len(transactions)} | "
            f"créées {result.created}, mises à jour {result.updated}, "
            f"doublons {result.duplicates}, ignorées {result.skipped}"
        ))
