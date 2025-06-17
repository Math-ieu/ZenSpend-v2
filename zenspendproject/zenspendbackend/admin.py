from django.contrib import admin
from .models import (
    User, BankAccount, Category, Tag, Transaction, Receipt, 
    RecurringSchedule, TransactionRule, Budget, SavingsGoal, 
    DebtTracker, SharedBudget, DebtRecord, Notification, 
    FinancialSnapshot, ImportSession, Achievement, Challenge, 
    FinancialReport, ChatSession, ChatMessage, UserPreference, 
    FinancialInsight
)

admin.site.register(User)
admin.site.register(BankAccount)
admin.site.register(Category)
admin.site.register(Tag)
admin.site.register(Transaction)
admin.site.register(Receipt)
admin.site.register(RecurringSchedule)
admin.site.register(TransactionRule)
admin.site.register(Budget)
admin.site.register(SavingsGoal)
admin.site.register(DebtTracker)
admin.site.register(SharedBudget)
admin.site.register(DebtRecord)
admin.site.register(Notification)
admin.site.register(FinancialSnapshot)
admin.site.register(ImportSession)
admin.site.register(Achievement)
admin.site.register(Challenge)
admin.site.register(FinancialReport)
admin.site.register(ChatSession)
admin.site.register(ChatMessage)
admin.site.register(UserPreference)
admin.site.register(FinancialInsight)
