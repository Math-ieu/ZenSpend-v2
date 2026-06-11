"""Generate due recurring transactions.

Run via cron / scheduler (e.g. daily):

    python manage.py generate_recurring_transactions
"""
from django.core.management.base import BaseCommand

from zenspendbackend.services.recurring import generate_due_recurring_transactions


class Command(BaseCommand):
    help = 'Generate transactions for all due recurring schedules.'

    def handle(self, *args, **options):
        created = generate_due_recurring_transactions()
        self.stdout.write(
            self.style.SUCCESS(f'Transactions récurrentes générées: {created}.')
        )
