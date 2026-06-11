"""CSV import of bank transactions.

Parses a user-provided CSV file with flexible column detection (date,
description/label, amount — or separate debit/credit columns), creates
:class:`Transaction` records, de-duplicates against existing transactions
and within the file itself, and runs auto-categorization on each new row.
"""
import csv
import hashlib
import io
from datetime import datetime
from decimal import Decimal, InvalidOperation

from django.utils import timezone

from ..models import Transaction
from .categorization import apply_rules_to_transaction


DATE_FORMATS = (
    '%Y-%m-%d',
    '%d/%m/%Y',
    '%d-%m-%Y',
    '%m/%d/%Y',
    '%Y/%m/%d',
    '%d.%m.%Y',
)

DATE_COLUMNS = ('date', 'date_operation', "date d'operation", 'transaction date')
DESCRIPTION_COLUMNS = (
    'description', 'libelle', 'libellé', 'label', 'name', 'intitule', 'intitulé',
    'details', 'memo', 'narration',
)
AMOUNT_COLUMNS = ('amount', 'montant', 'value', 'valeur')
DEBIT_COLUMNS = ('debit', 'débit', 'withdrawal', 'depense', 'dépense')
CREDIT_COLUMNS = ('credit', 'crédit', 'deposit', 'recette')
PAYEE_COLUMNS = ('payee', 'beneficiaire', 'bénéficiaire', 'merchant', 'tiers')


class CSVImportError(Exception):
    """Raised when the CSV cannot be parsed at all (e.g. no usable columns)."""


def _pick_column(fieldnames, candidates):
    normalized = {(name or '').strip().lower(): name for name in fieldnames}
    for candidate in candidates:
        if candidate in normalized:
            return normalized[candidate]
    return None


def _parse_date(raw):
    raw = (raw or '').strip()
    if not raw:
        return None
    for fmt in DATE_FORMATS:
        try:
            naive = datetime.strptime(raw, fmt)
            return timezone.make_aware(naive, timezone.get_current_timezone())
        except ValueError:
            continue
    return None


def _parse_amount(raw):
    """Parse a monetary string into a Decimal, handling FR/EN formats."""
    if raw is None:
        return None
    text = str(raw).strip()
    if not text:
        return None

    negative = False
    if text.startswith('(') and text.endswith(')'):
        negative = True
        text = text[1:-1]
    # Drop currency symbols, spaces and non-breaking spaces.
    for ch in ('€', '$', '£', ' ', '\xa0'):
        text = text.replace(ch, '')
    if text.startswith('-'):
        negative = True
        text = text[1:]
    elif text.startswith('+'):
        text = text[1:]

    # Normalize decimal separator: if both separators present, assume the last
    # one is the decimal separator and the other is a thousands separator.
    if ',' in text and '.' in text:
        if text.rfind(',') > text.rfind('.'):
            text = text.replace('.', '').replace(',', '.')
        else:
            text = text.replace(',', '')
    else:
        text = text.replace(',', '.')

    try:
        value = Decimal(text)
    except (InvalidOperation, ValueError):
        return None
    return -value if negative else value


def _signature(account_id, date, amount, description):
    key = f'{account_id}|{date.isoformat() if date else ""}|{amount}|{description.strip().lower()}'
    return hashlib.sha256(key.encode('utf-8')).hexdigest()


def parse_csv_rows(file_bytes):
    """Yield normalized (date, description, amount, payee) tuples from CSV bytes."""
    try:
        text = file_bytes.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = file_bytes.decode('latin-1')

    sample = text[:2048]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=',;\t')
    except csv.Error:
        dialect = csv.excel
        dialect.delimiter = ';' if sample.count(';') > sample.count(',') else ','

    reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    if not reader.fieldnames:
        raise CSVImportError('Le fichier CSV est vide ou illisible.')

    date_col = _pick_column(reader.fieldnames, DATE_COLUMNS)
    desc_col = _pick_column(reader.fieldnames, DESCRIPTION_COLUMNS)
    amount_col = _pick_column(reader.fieldnames, AMOUNT_COLUMNS)
    debit_col = _pick_column(reader.fieldnames, DEBIT_COLUMNS)
    credit_col = _pick_column(reader.fieldnames, CREDIT_COLUMNS)
    payee_col = _pick_column(reader.fieldnames, PAYEE_COLUMNS)

    if amount_col is None and debit_col is None and credit_col is None:
        raise CSVImportError(
            "Aucune colonne de montant détectée (attendu : 'montant'/'amount' "
            "ou 'débit'/'crédit')."
        )

    for row in reader:
        description = (row.get(desc_col) or '').strip() if desc_col else ''
        payee = (row.get(payee_col) or '').strip() if payee_col else ''
        date = _parse_date(row.get(date_col)) if date_col else None

        if amount_col is not None:
            amount = _parse_amount(row.get(amount_col))
        else:
            debit = _parse_amount(row.get(debit_col)) if debit_col else None
            credit = _parse_amount(row.get(credit_col)) if credit_col else None
            amount = None
            if credit is not None:
                amount = abs(credit)
            elif debit is not None:
                amount = -abs(debit)

        if amount is None:
            continue  # skip rows without a usable amount
        yield date, description, amount, payee


def import_transactions_from_csv(user, account, file_bytes, file_name=''):
    """Import transactions from CSV bytes for ``user``.

    Returns a dict with created / duplicates / skipped counts. Raises
    :class:`CSVImportError` if the file cannot be parsed.
    """
    rows = list(parse_csv_rows(file_bytes))

    account_id = account.id if account else None
    existing = set(
        _signature(account_id, t.date, t.amount, t.description)
        for t in Transaction.objects.filter(user=user, account=account)
    )

    created = 0
    duplicates = 0
    skipped = 0
    seen_in_file = set()

    for date, description, amount, payee in rows:
        if date is None:
            skipped += 1
            continue
        signature = _signature(account_id, date, amount, description)
        if signature in existing or signature in seen_in_file:
            duplicates += 1
            continue
        seen_in_file.add(signature)

        transaction = Transaction.objects.create(
            user=user,
            account=account,
            amount=amount,
            description=description,
            payee=payee,
            date=date,
            original_currency=getattr(account, 'currency', '') or '',
        )
        apply_rules_to_transaction(transaction)
        created += 1

    return {
        'created': created,
        'duplicates': duplicates,
        'skipped': skipped,
        'total_rows': len(rows),
    }
