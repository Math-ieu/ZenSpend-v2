"""Generation of in-app notifications from financial events.

Covers the MVP triggers: budget threshold reached, savings goal reached and
upcoming debt payment. Each generator de-duplicates so a user is not spammed
with the same alert repeatedly.
"""
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from ..models import Notification, Budget, SavingsGoal, DebtTracker


def _notify(user, *, type, title, message, related_object_id='', priority='medium', action_url=''):
    return Notification.objects.create(
        user=user,
        type=type,
        title=title,
        message=message,
        related_object_id=str(related_object_id) if related_object_id else '',
        priority=priority,
        action_url=action_url,
    )


def check_budget_alerts(user, budgets=None):
    """Create a budget_alert when spending reaches the budget's alert threshold."""
    created = []
    queryset = budgets if budgets is not None else Budget.objects.filter(user=user)
    for budget in queryset:
        if not budget.amount or budget.amount <= 0:
            continue
        threshold = budget.alert_threshold or Decimal('80')
        if budget.percentage_used < threshold:
            continue
        # Skip if an unread alert already exists for this budget.
        already = Notification.objects.filter(
            user=user,
            type='budget_alert',
            related_object_id=str(budget.id),
            is_read=False,
        ).exists()
        if already:
            continue
        over = budget.percentage_used >= 100
        created.append(_notify(
            user,
            type='budget_alert',
            title=f'Budget « {budget.name} »',
            message=(
                f"Vous avez dépassé votre budget « {budget.name} »."
                if over else
                f"Vous avez atteint {budget.percentage_used:.0f}% de votre budget « {budget.name} »."
            ),
            related_object_id=budget.id,
            priority='high' if over else 'medium',
            action_url='/budgets',
        ))
    return created


def check_goals_reached(user, goals=None):
    """Create a goal_reached notification (once) when a goal hits its target."""
    created = []
    queryset = goals if goals is not None else SavingsGoal.objects.filter(user=user)
    for goal in queryset:
        if not goal.target_amount or goal.target_amount <= 0:
            continue
        if goal.current_amount < goal.target_amount:
            continue
        # Only notify once per goal, ever.
        already = Notification.objects.filter(
            user=user,
            type='goal_reached',
            related_object_id=str(goal.id),
        ).exists()
        if already:
            continue
        created.append(_notify(
            user,
            type='goal_reached',
            title=f'Objectif atteint : {goal.name}',
            message=f"Félicitations ! Vous avez atteint votre objectif « {goal.name} ».",
            related_object_id=goal.id,
            priority='high',
            action_url='/goals',
        ))
    return created


def check_debt_reminders(user, days=7):
    """Create a debt_reminder when a debt's monthly due day is within ``days``.

    ``payment_due_date`` is a day-of-month (1-31). We notify at most once per
    debt within a ~20 day window to avoid repeats.
    """
    created = []
    today = timezone.now().date()
    window_start = timezone.now() - timedelta(days=20)
    for debt in DebtTracker.objects.filter(user=user):
        due_day = debt.payment_due_date
        if not due_day:
            continue
        delta = due_day - today.day
        if delta < 0 or delta > days:
            continue
        already = Notification.objects.filter(
            user=user,
            type='debt_reminder',
            related_object_id=str(debt.id),
            created_at__gte=window_start,
        ).exists()
        if already:
            continue
        created.append(_notify(
            user,
            type='debt_reminder',
            title=f'Échéance à venir : {debt.name}',
            message=(
                f"Le paiement de « {debt.name} » est prévu le {due_day} du mois "
                f"(dans {delta} jour(s))."
            ),
            related_object_id=debt.id,
            priority='medium',
            action_url='/dettes',
        ))
    return created


def run_all_checks(user):
    """Run every notification generator for a user. Returns the total created."""
    created = []
    created += check_budget_alerts(user)
    created += check_goals_reached(user)
    created += check_debt_reminders(user)
    return created
