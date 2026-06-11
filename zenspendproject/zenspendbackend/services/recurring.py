"""Generation of recurring transactions from RecurringSchedule templates.

A :class:`RecurringSchedule` linked to a template transaction produces a new
transaction each time ``next_occurrence`` is due. After generating, the
schedule advances ``next_occurrence`` by its frequency until it is in the future
or past ``end_date``.
"""
import calendar
from datetime import timedelta

from django.db import transaction as db_transaction
from django.utils import timezone

from ..models import RecurringSchedule, Transaction
from .categorization import apply_rules_to_transaction


def _add_months(dt, months):
    """Return ``dt`` shifted by ``months`` months, clamping the day of month."""
    month_index = dt.month - 1 + months
    year = dt.year + month_index // 12
    month = month_index % 12 + 1
    day = min(dt.day, calendar.monthrange(year, month)[1])
    return dt.replace(year=year, month=month, day=day)


def _advance(dt, frequency):
    if frequency == 'daily':
        return dt + timedelta(days=1)
    if frequency == 'weekly':
        return dt + timedelta(weeks=1)
    if frequency == 'biweekly':
        return dt + timedelta(weeks=2)
    if frequency == 'monthly':
        return _add_months(dt, 1)
    if frequency == 'quarterly':
        return _add_months(dt, 3)
    if frequency == 'yearly':
        return _add_months(dt, 12)
    return None


def _clone_transaction(template, occurrence_date):
    new_tx = Transaction.objects.create(
        user=template.user,
        account=template.account,
        category=template.category,
        amount=template.amount,
        original_amount=template.original_amount,
        original_currency=template.original_currency,
        description=template.description,
        payee=template.payee,
        location=template.location,
        notes=template.notes,
        status=template.status,
        date=occurrence_date,
        is_recurring=True,
    )
    tags = list(template.tags.all())
    if tags:
        new_tx.tags.add(*tags)
    if not new_tx.category_id:
        apply_rules_to_transaction(new_tx)
    return new_tx


def generate_due_recurring_transactions(now=None):
    """Generate all due recurring transactions. Returns the count created."""
    now = now or timezone.now()
    created = 0

    schedules = (
        RecurringSchedule.objects.filter(
            transaction__isnull=False,
            next_occurrence__isnull=False,
            next_occurrence__lte=now,
        )
        .select_related('transaction')
    )

    for schedule in schedules:
        frequency = schedule.frequency
        with db_transaction.atomic():
            # Generate every occurrence that is already due (catch-up), capped to
            # avoid runaway loops on misconfigured schedules.
            guard = 0
            while (
                schedule.next_occurrence
                and schedule.next_occurrence <= now
                and (schedule.end_date is None or schedule.next_occurrence <= schedule.end_date)
                and guard < 60
            ):
                _clone_transaction(schedule.transaction, schedule.next_occurrence)
                created += 1
                guard += 1
                nxt = _advance(schedule.next_occurrence, frequency)
                if nxt is None or nxt == schedule.next_occurrence:
                    break
                schedule.next_occurrence = nxt
            schedule.save(update_fields=['next_occurrence'])

    return created
