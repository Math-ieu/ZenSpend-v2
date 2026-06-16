from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from .models import BankAccount, BankConnection
from .services import (
    BankProviderError,
    get_bank_provider_client,
    sync_transactions_for_connection,
)


class BankLinkSessionRequestSerializer(serializers.Serializer):
    redirect_uri = serializers.URLField(required=False)
    state = serializers.CharField(required=False, allow_blank=False, max_length=128)


class CallbackBankAccountSerializer(serializers.Serializer):
    external_account_id = serializers.CharField(max_length=128)
    name = serializers.CharField(max_length=100)
    account_type = serializers.ChoiceField(choices=['checking', 'savings', 'credit', 'investment', 'cash', 'other'])
    currency = serializers.CharField(max_length=3, required=False, default='EUR')
    balance = serializers.DecimalField(max_digits=15, decimal_places=2, required=False, default='0')
    account_number = serializers.CharField(max_length=50, required=False, allow_blank=True)


class BankCallbackRequestSerializer(serializers.Serializer):
    external_connection_id = serializers.CharField(max_length=128)
    provider = serializers.CharField(max_length=50, required=False)
    institution_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    consent_expires_at = serializers.DateTimeField(required=False)
    status = serializers.ChoiceField(
        choices=['pending', 'connected', 'action_required', 'disconnected', 'error'],
        required=False,
        default='connected',
    )
    metadata = serializers.JSONField(required=False, default=dict)
    accounts = CallbackBankAccountSerializer(required=False, many=True, default=list)


class BankTransactionPayloadSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=128)
    account_external_id = serializers.CharField(max_length=128, required=False, allow_blank=True)
    account_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    description = serializers.CharField(max_length=200, required=False, allow_blank=True)
    date = serializers.DateTimeField(required=False)
    payee = serializers.CharField(max_length=100, required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=['pending', 'cleared', 'reconciled'], required=False)
    notes = serializers.CharField(required=False, allow_blank=True)


class BankSyncRequestSerializer(serializers.Serializer):
    connection_id = serializers.IntegerField()
    transactions = BankTransactionPayloadSerializer(many=True)


class BankProviderSyncRequestSerializer(serializers.Serializer):
    connection_id = serializers.IntegerField()


def _find_bank_account_by_external_id(user, provider, external_account_id):
    user_accounts = BankAccount.objects.filter(user=user)
    for account in user_accounts:
        details = account.connection_details or {}
        if details.get('provider') == provider and details.get('external_account_id') == external_account_id:
            return account
    return None


def _upsert_callback_accounts(user, provider, external_connection_id, institution_name, accounts):
    connected_accounts = []

    for account_payload in accounts:
        external_account_id = account_payload['external_account_id']
        existing_account = _find_bank_account_by_external_id(user, provider, external_account_id)

        connection_details = {
            'provider': provider,
            'external_account_id': external_account_id,
            'external_connection_id': external_connection_id,
        }

        if existing_account is None:
            existing_account = BankAccount.objects.create(
                user=user,
                name=account_payload['name'],
                account_number=account_payload.get('account_number', ''),
                balance=account_payload.get('balance', 0),
                currency=account_payload.get('currency', 'EUR'),
                account_type=account_payload['account_type'],
                institution=institution_name,
                connection_details=connection_details,
                last_sync=timezone.now(),
            )
        else:
            existing_account.name = account_payload['name']
            existing_account.account_number = account_payload.get('account_number', existing_account.account_number)
            existing_account.balance = account_payload.get('balance', existing_account.balance)
            existing_account.currency = account_payload.get('currency', existing_account.currency)
            existing_account.account_type = account_payload['account_type']
            existing_account.institution = institution_name or existing_account.institution
            existing_account.connection_details = connection_details
            existing_account.last_sync = timezone.now()
            existing_account.save()

        connected_accounts.append(existing_account)

    return connected_accounts


class BankIntegrationStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client = get_bank_provider_client()
        return Response(
            {
                "status": "ok",
                "integration": client.healthcheck(),
                "capabilities": {
                    "create_link_session": client.is_configured,
                },
            },
            status=status.HTTP_200_OK,
        )


class BankLinkSessionCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BankLinkSessionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        client = get_bank_provider_client()

        if not client.is_configured:
            return Response(
                {
                    "status": "error",
                    "message": "Bank provider is not configured.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            link_session = client.create_link_session(
                redirect_uri=serializer.validated_data.get("redirect_uri"),
                state=serializer.validated_data.get("state"),
            )
        except BankProviderError as exc:
            return Response(
                {
                    "status": "error",
                    "message": str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "status": "success",
                "link_session": link_session.to_dict(),
            },
            status=status.HTTP_201_CREATED,
        )


class BankCallbackView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BankCallbackRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        client = get_bank_provider_client()
        payload = serializer.validated_data
        provider = payload.get('provider') or client.provider_name
        external_connection_id = payload['external_connection_id']

        bank_connection, created = BankConnection.objects.update_or_create(
            user=request.user,
            provider=provider,
            external_connection_id=external_connection_id,
            defaults={
                'status': payload.get('status', 'connected'),
                'institution_name': payload.get('institution_name', ''),
                'consent_expires_at': payload.get('consent_expires_at'),
                'metadata': payload.get('metadata', {}),
            },
        )

        accounts = payload.get('accounts', [])
        # If the caller did not supply accounts, discover them server-side from
        # the provider (avoids the client fabricating account data).
        if not accounts and client.provider_name == provider:
            try:
                accounts = client.fetch_connection_accounts(external_connection_id)
            except BankProviderError:
                accounts = []

        connected_accounts = _upsert_callback_accounts(
            user=request.user,
            provider=provider,
            external_connection_id=external_connection_id,
            institution_name=payload.get('institution_name', ''),
            accounts=accounts,
        )

        return Response(
            {
                'status': 'success',
                'created': created,
                'bank_connection': {
                    'id': bank_connection.id,
                    'provider': bank_connection.provider,
                    'external_connection_id': bank_connection.external_connection_id,
                    'status': bank_connection.status,
                },
                'accounts_connected': len(connected_accounts),
            },
            status=status.HTTP_200_OK,
        )


class BankSyncTransactionsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BankSyncRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        bank_connection = BankConnection.objects.filter(
            id=serializer.validated_data['connection_id'],
            user=request.user,
        ).first()

        if bank_connection is None:
            return Response(
                {
                    'status': 'error',
                    'message': 'Bank connection not found.',
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        normalized_transactions = []
        for tx in serializer.validated_data['transactions']:
            transaction_entry = {
                'id': tx['id'],
                'account_external_id': tx.get('account_external_id', ''),
                'account_name': tx.get('account_name', ''),
                'amount': str(tx['amount']),
                'description': tx.get('description', ''),
                'date': tx.get('date').isoformat() if tx.get('date') else None,
                'payee': tx.get('payee', ''),
                'status': tx.get('status', 'cleared'),
                'notes': tx.get('notes', ''),
            }
            normalized_transactions.append(transaction_entry)

        sync_result = sync_transactions_for_connection(
            connection=bank_connection,
            transactions=normalized_transactions,
        )

        return Response(
            {
                'status': 'success',
                'connection_id': bank_connection.id,
                'sync_result': sync_result.to_dict(),
            },
            status=status.HTTP_200_OK,
        )


class BankSyncFromProviderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BankProviderSyncRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        bank_connection = BankConnection.objects.filter(
            id=serializer.validated_data['connection_id'],
            user=request.user,
        ).first()

        if bank_connection is None:
            return Response(
                {
                    'status': 'error',
                    'message': 'Bank connection not found.',
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        client = get_bank_provider_client()

        if client.provider_name != bank_connection.provider:
            return Response(
                {
                    'status': 'error',
                    'message': (
                        f"Provider mismatch: connection expects '{bank_connection.provider}' "
                        f"but backend is configured for '{client.provider_name}'."
                    ),
                },
                status=status.HTTP_409_CONFLICT,
            )

        try:
            provider_transactions = client.fetch_connection_transactions(
                external_connection_id=bank_connection.external_connection_id,
            )
        except BankProviderError as exc:
            return Response(
                {
                    'status': 'error',
                    'message': str(exc),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        sync_result = sync_transactions_for_connection(
            connection=bank_connection,
            transactions=provider_transactions,
        )

        return Response(
            {
                'status': 'success',
                'connection_id': bank_connection.id,
                'fetched_transactions': len(provider_transactions),
                'sync_result': sync_result.to_dict(),
            },
            status=status.HTTP_200_OK,
        )
