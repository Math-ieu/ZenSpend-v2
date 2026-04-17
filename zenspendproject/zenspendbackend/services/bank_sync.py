from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation
import hashlib
import json
from typing import Any, Dict, List, Optional

from django.db import transaction as db_transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from ..models import BankAccount, BankConnection, ExternalTransaction, Transaction


VALID_TRANSACTION_STATUSES = {'pending', 'cleared', 'reconciled'}


@dataclass
class BankSyncResult:
    created: int = 0
    updated: int = 0
    duplicates: int = 0
    skipped: int = 0

    def to_dict(self) -> Dict[str, int]:
        return {
            'created': self.created,
            'updated': self.updated,
            'duplicates': self.duplicates,
            'skipped': self.skipped,
        }


def _payload_hash(payload: Dict[str, Any]) -> str:
    normalized = json.dumps(payload, sort_keys=True, default=str, separators=(',', ':'))
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()


def _safe_decimal(value: Any) -> Optional[Decimal]:
    if value is None:
        return None

    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None


def _parse_transaction_date(value: Optional[str]) -> datetime:
    if value:
        parsed = parse_datetime(value)
        if parsed is not None:
            if timezone.is_naive(parsed):
                return timezone.make_aware(parsed, timezone.get_current_timezone())
            return parsed

    return timezone.now()


def _resolve_account(user, provider: str, external_connection_id: str, account_external_id: Optional[str], fallback_name: Optional[str]):
    if account_external_id:
        user_accounts = BankAccount.objects.filter(user=user)
        for account in user_accounts:
            details = account.connection_details or {}
            if details.get('provider') == provider and details.get('external_account_id') == account_external_id:
                return account

    if fallback_name:
        return BankAccount.objects.filter(user=user, name=fallback_name).first()

    return None


def sync_transactions_for_connection(connection: BankConnection, transactions: List[Dict[str, Any]]) -> BankSyncResult:
    result = BankSyncResult()

    with db_transaction.atomic():
        for payload in transactions:
            external_transaction_id = str(payload.get('id', '')).strip()
            if not external_transaction_id:
                result.skipped += 1
                continue

            amount = _safe_decimal(payload.get('amount'))
            if amount is None:
                result.skipped += 1
                continue

            account = _resolve_account(
                user=connection.user,
                provider=connection.provider,
                external_connection_id=connection.external_connection_id,
                account_external_id=payload.get('account_external_id'),
                fallback_name=payload.get('account_name'),
            )

            tx_status = str(payload.get('status', 'cleared')).lower()
            if tx_status not in VALID_TRANSACTION_STATUSES:
                tx_status = 'cleared'

            transaction_data = {
                'user': connection.user,
                'account': account,
                'amount': amount,
                'description': str(payload.get('description', '')).strip(),
                'date': _parse_transaction_date(payload.get('date')),
                'payee': str(payload.get('payee', '')).strip(),
                'status': tx_status,
                'notes': str(payload.get('notes', '')).strip(),
            }

            current_hash = _payload_hash(payload)

            external_reference = ExternalTransaction.objects.select_related('transaction').filter(
                bank_connection=connection,
                external_transaction_id=external_transaction_id,
            ).first()

            if external_reference is None:
                transaction_obj = Transaction.objects.create(**transaction_data)
                ExternalTransaction.objects.create(
                    bank_connection=connection,
                    external_transaction_id=external_transaction_id,
                    transaction=transaction_obj,
                    bank_account=account,
                    payload_hash=current_hash,
                    payload=payload,
                )
                result.created += 1
                continue

            if external_reference.payload_hash == current_hash:
                result.duplicates += 1
                continue

            transaction_obj = external_reference.transaction
            for field, value in transaction_data.items():
                setattr(transaction_obj, field, value)
            transaction_obj.save()

            external_reference.bank_account = account
            external_reference.payload_hash = current_hash
            external_reference.payload = payload
            external_reference.save(update_fields=['bank_account', 'payload_hash', 'payload', 'updated_at'])
            result.updated += 1

        connection.last_sync_at = timezone.now()
        connection.status = 'connected'
        connection.save(update_fields=['last_sync_at', 'status', 'updated_at'])

    return result
