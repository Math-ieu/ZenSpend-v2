"""Purge des comptes supprimés par l'utilisateur (soft delete).

Supprime définitivement les comptes désactivés dont la suppression a été
demandée il y a plus de `--days` jours (30 par défaut). La suppression est en
cascade : transactions, comptes, budgets, objectifs, etc. liés à l'utilisateur.

Run via cron / scheduler:

    python manage.py purge_deleted_accounts
    python manage.py purge_deleted_accounts --days 30 --dry-run
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

DEFAULT_RETENTION_DAYS = 30


class Command(BaseCommand):
    help = 'Supprime définitivement les comptes désactivés au-delà du délai de rétention.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=DEFAULT_RETENTION_DAYS,
            help='Délai de rétention en jours avant purge définitive (défaut: 30).',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Affiche les comptes concernés sans les supprimer.',
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        cutoff = timezone.now() - timedelta(days=days)

        qs = User.objects.filter(
            is_active=False,
            deletion_requested_at__isnull=False,
            deletion_requested_at__lte=cutoff,
        )
        count = qs.count()

        if dry_run:
            for user in qs:
                self.stdout.write(
                    f'[dry-run] À purger: {user.email} '
                    f'(demande: {user.deletion_requested_at:%Y-%m-%d})'
                )
            self.stdout.write(
                self.style.WARNING(f'[dry-run] {count} compte(s) seraient purgés.')
            )
            return

        qs.delete()
        self.stdout.write(
            self.style.SUCCESS(
                f'{count} compte(s) supprimé(s) définitivement '
                f'(rétention {days} jours).'
            )
        )
