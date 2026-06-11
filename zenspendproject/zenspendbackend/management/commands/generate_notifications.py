"""Daily notification generation.

Run via cron / scheduler:

    python manage.py generate_notifications
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from zenspendbackend.services.notifications import run_all_checks

User = get_user_model()


class Command(BaseCommand):
    help = 'Generate budget / goal / debt notifications for all active users.'

    def handle(self, *args, **options):
        total = 0
        users = User.objects.filter(is_active=True)
        for user in users:
            created = run_all_checks(user)
            total += len(created)
        self.stdout.write(
            self.style.SUCCESS(
                f'Notifications générées: {total} pour {users.count()} utilisateur(s).'
            )
        )
