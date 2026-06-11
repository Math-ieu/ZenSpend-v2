"""Deterministic auto-categorization of transactions from user-defined rules.

A :class:`TransactionRule` matches a transaction when every criterion it
specifies (keywords, payee, amount range) is satisfied, and at least one
criterion is specified. The first matching active rule (lowest id) wins.
"""
from decimal import Decimal, InvalidOperation


def _matches_keywords(rule, haystack):
    keywords = rule.keywords or []
    if not keywords:
        return None  # criterion not specified
    haystack = (haystack or '').lower()
    return any(str(kw).lower() in haystack for kw in keywords if str(kw).strip())


def _matches_payee(rule, payee):
    if not rule.payee:
        return None  # criterion not specified
    return rule.payee.lower() in (payee or '').lower()


def _matches_amount(rule, amount):
    if rule.amount_min is None and rule.amount_max is None:
        return None  # criterion not specified
    try:
        value = abs(Decimal(amount))
    except (InvalidOperation, TypeError):
        return False
    if rule.amount_min is not None and value < rule.amount_min:
        return False
    if rule.amount_max is not None and value > rule.amount_max:
        return False
    return True


def _rule_matches(rule, *, description, payee, amount):
    haystack = ' '.join(filter(None, [description, payee]))
    checks = [
        _matches_keywords(rule, haystack),
        _matches_payee(rule, payee),
        _matches_amount(rule, amount),
    ]
    specified = [c for c in checks if c is not None]
    if not specified:
        return False  # an empty rule never matches
    return all(specified)


def find_matching_rule(user, *, description, payee, amount):
    """Return the first active rule of ``user`` matching the transaction, or None."""
    rules = (
        user.transactionrule_set.filter(is_active=True)
        .prefetch_related('assign_tags')
        .order_by('id')
    )
    for rule in rules:
        if _rule_matches(rule, description=description, payee=payee, amount=amount):
            return rule
    return None


def apply_rules_to_transaction(transaction):
    """Apply the first matching rule to ``transaction`` in place.

    Only fills the category when it is empty (never overrides an explicit
    choice) and adds the rule's tags. Returns the rule that was applied, or None.
    """
    if transaction.category_id:
        return None  # respect an explicitly chosen category

    rule = find_matching_rule(
        transaction.user,
        description=transaction.description,
        payee=transaction.payee,
        amount=transaction.amount,
    )
    if rule is None:
        return None

    changed = False
    if rule.assign_category_id and not transaction.category_id:
        transaction.category = rule.assign_category
        changed = True
    if changed:
        transaction.save(update_fields=['category'])

    tags = list(rule.assign_tags.all())
    if tags:
        transaction.tags.add(*tags)

    return rule
