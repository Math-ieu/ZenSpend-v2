from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.gis.db import models
from django.utils import timezone



# zenspendproject/zenspendbackend/models.py
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email est obligatoire')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_admin', True)
        return self.create_user(email, password, **extra_fields)



class User(AbstractBaseUser):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    profile_pic = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    preferred_currency = models.CharField(max_length=3, default='EUR')
    notification_preferences = models.JSONField(default=dict(email=True, app=True, budget_alerts=True))

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    objects = UserManager()

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

    @property
    def is_staff(self):
        return self.is_admin

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

class BankAccount(models.Model):
    name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50, blank=True)
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    currency = models.CharField(max_length=3, default='EUR')
    account_type = models.CharField(max_length=20, choices=[
        ('checking', 'Checking'),
        ('savings', 'Savings'),
        ('credit', 'Credit'),
        ('investment', 'Investment'),
        ('cash', 'Cash'),
        ('other', 'Other'),
    ])
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    institution = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    last_sync = models.DateTimeField(null=True, blank=True)
    connection_details = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'bank_accounts'

    def __str__(self):
        return f"{self.name} ({self.account_type})"

class Category(models.Model):
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=7, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    is_expense = models.BooleanField(default=True)
    is_tax_deductible = models.BooleanField(default=False)
    parent_category = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    is_system = models.BooleanField(default=False)

    class Meta:
        db_table = 'categories'

    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=50)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    color = models.CharField(max_length=7, blank=True)

    class Meta:
        db_table = 'tags'
        unique_together = ['name', 'user']

    def __str__(self):
        return self.name

class Receipt(models.Model):
    transaction = models.OneToOneField('Transaction', on_delete=models.CASCADE, related_name='receipt')
    image_url = models.CharField(max_length=255, blank=True)
    ocr_text = models.TextField(blank=True)
    processed_data = models.JSONField(default=dict, blank=True)
    date_added = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'receipts'

    def __str__(self):
        return f"Receipt for {self.transaction}"

class RecurringSchedule(models.Model):
    transaction = models.OneToOneField('Transaction', on_delete=models.CASCADE, related_name='recurring_schedule', null=True, blank=True)
    budget = models.OneToOneField('Budget', on_delete=models.CASCADE, related_name='recurring_schedule', null=True, blank=True)
    frequency = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('biweekly', 'Biweekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ])
    day_of_month = models.IntegerField(null=True, blank=True)
    day_of_week = models.IntegerField(null=True, blank=True)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    next_occurrence = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'recurring_schedules'

    def __str__(self):
        return f"{self.frequency} schedule"

class Transaction(models.Model):
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    original_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    original_currency = models.CharField(max_length=3, blank=True)
    description = models.CharField(max_length=200, blank=True)
    date = models.DateTimeField(default=timezone.now)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.ManyToManyField(Tag, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True)
    is_recurring = models.BooleanField(default=False)
    location = models.PointField(null=True, blank=True)
    payee = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('cleared', 'Cleared'),
        ('reconciled', 'Reconciled'),
    ], default='cleared')
    notes = models.TextField(blank=True)
    is_split = models.BooleanField(default=False)
    parent_transaction = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'transactions'
        indexes = [
            models.Index(fields=['-date']),
        ]

    def __str__(self):
        return f"{self.description} - {self.amount}€"



class TransactionRule(models.Model):
    name = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    keywords = models.JSONField(default=list)
    amount_min = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    amount_max = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    payee = models.CharField(max_length=100, blank=True)
    assign_category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    assign_tags = models.ManyToManyField(Tag, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'transaction_rules'

    def __str__(self):
        return self.name



class Budget(models.Model):
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    categories = models.ManyToManyField(Category, blank=True)
    accounts = models.ManyToManyField(BankAccount, blank=True)
    is_recurring = models.BooleanField(default=False)
    current_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    alert_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=80)

    class Meta:
        db_table = 'budgets'

    def __str__(self):
        return self.name

    @property
    def percentage_used(self):
        if self.amount == 0:
            return 0
        return (self.current_amount / self.amount) * 100

class SavingsGoal(models.Model):
    name = models.CharField(max_length=100)
    target_amount = models.DecimalField(max_digits=15, decimal_places=2)
    current_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    deadline = models.DateTimeField(null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    icon = models.CharField(max_length=50, blank=True)
    account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True)
    auto_save = models.BooleanField(default=False)
    auto_save_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    auto_save_frequency = models.CharField(max_length=20, choices=[
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ], blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'savings_goals'

    def __str__(self):
        return self.name

    @property
    def percentage_complete(self):
        if self.target_amount == 0:
            return 0
        return (self.current_amount / self.target_amount) * 100


class DebtTracker(models.Model):
    name = models.CharField(max_length=100)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    remaining_amount = models.DecimalField(max_digits=15, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True)
    minimum_payment = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    payment_due_date = models.IntegerField(null=True, blank=True)
    lender = models.CharField(max_length=100, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'debt_trackers'

    def __str__(self):
        return self.name

class SharedBudget(models.Model):
    name = models.CharField(max_length=100)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_budgets')
    members = models.ManyToManyField(User, related_name='shared_budgets')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)
    categories = models.ManyToManyField(Category, blank=True)
    current_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    class Meta:
        db_table = 'shared_budgets'

    def __str__(self):
        return self.name

class DebtRecord(models.Model):
    creditor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='creditor_records')
    debtor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='debtor_records')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.CharField(max_length=200, blank=True)
    date_created = models.DateTimeField(default=timezone.now)
    due_date = models.DateTimeField(null=True, blank=True)
    is_settled = models.BooleanField(default=False)
    settled_date = models.DateTimeField(null=True, blank=True)
    related_transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = 'debt_records'

    def __str__(self):
        return f"{self.debtor.full_name} doit {self.amount}€ à {self.creditor.full_name}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)
    type = models.CharField(max_length=50, choices=[
        ('budget_alert', 'Budget Alert'),
        ('goal_reached', 'Goal Reached'),
        ('recurring_payment', 'Recurring Payment'),
        ('system_message', 'System Message'),
        ('debt_reminder', 'Debt Reminder'),
        ('category_suggestion', 'Category Suggestion'),
        ('unusual_activity', 'Unusual Activity'),
        ('milestone', 'Milestone'),
        ('weekly_summary', 'Weekly Summary'),
    ])
    priority = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ], default='medium')
    related_object_id = models.CharField(max_length=36, blank=True)
    action_url = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'notifications'
        indexes = [
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.title

class FinancialSnapshot(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateTimeField(default=timezone.now)
    total_assets = models.DecimalField(max_digits=15, decimal_places=2)
    total_liabilities = models.DecimalField(max_digits=15, decimal_places=2)
    net_worth = models.DecimalField(max_digits=15, decimal_places=2)
    total_income_mtd = models.DecimalField(max_digits=15, decimal_places=2)
    total_expenses_mtd = models.DecimalField(max_digits=15, decimal_places=2)
    accounts_snapshot = models.JSONField(default=dict)

    class Meta:
        db_table = 'financial_snapshots'
        indexes = [
            models.Index(fields=['-date']),
        ]

    def __str__(self):
        return f"Snapshot {self.date.strftime('%Y-%m-%d')}"

class ImportSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    source = models.CharField(max_length=20, choices=[
        ('csv', 'CSV'),
        ('ofx', 'OFX'),
        ('pdf', 'PDF'),
        ('api', 'API'),
        ('manual', 'Manual'),
    ])
    date_imported = models.DateTimeField(default=timezone.now)
    account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True)
    file_name = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ])
    error_message = models.TextField(blank=True)
    transactions_count = models.IntegerField(default=0)
    duplicates_count = models.IntegerField(default=0)

    class Meta:
        db_table = 'import_sessions'

    def __str__(self):
        return f"Import {self.date_imported.strftime('%Y-%m-%d %H:%M')} - {self.source}"

class Achievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    date_earned = models.DateTimeField(default=timezone.now)
    achievement_type = models.CharField(max_length=50, choices=[
        ('saving_streak', 'Saving Streak'),
        ('budget_complete', 'Budget Complete'),
        ('first_goal', 'First Goal'),
        ('categorization_master', 'Categorization Master'),
        ('data_entry', 'Data Entry'),
        ('app_usage', 'App Usage'),
        ('financial_literacy', 'Financial Literacy'),
        ('custom', 'Custom'),
    ])
    level = models.IntegerField(default=1)

    class Meta:
        db_table = 'achievements'

    def __str__(self):
        return self.name

class Challenge(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    target_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    current_value = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    challenge_type = models.CharField(max_length=50, choices=[
        ('reduce_spending', 'Reduce Spending'),
        ('increase_saving', 'Increase Saving'),
        ('category_budget', 'Category Budget'),
        ('no_spend', 'No Spend'),
        ('debt_reduction', 'Debt Reduction'),
        ('custom', 'Custom'),
    ])
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)

    class Meta:
        db_table = 'challenges'

    def __str__(self):
        return self.name

class FinancialReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    report_type = models.CharField(max_length=50, choices=[
        ('monthly_summary', 'Monthly Summary'),
        ('annual_review', 'Annual Review'),
        ('tax_report', 'Tax Report'),
        ('category_analysis', 'Category Analysis'),
        ('forecast', 'Forecast'),
        ('net_worth', 'Net Worth'),
        ('custom', 'Custom'),
    ])
    date_range_start = models.DateTimeField(null=True, blank=True)
    date_range_end = models.DateTimeField(null=True, blank=True)
    generation_date = models.DateTimeField(default=timezone.now)
    data = models.JSONField(default=dict)
    is_scheduled = models.BooleanField(default=False)
    schedule_frequency = models.CharField(max_length=20, choices=[
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ], blank=True)

    class Meta:
        db_table = 'financial_reports'

    def __str__(self):
        return self.title

class ChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    started_at = models.DateTimeField(default=timezone.now)
    last_activity = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    context = models.JSONField(default=dict)

    class Meta:
        db_table = 'chat_sessions'

    def __str__(self):
        return f"Session {self.id} - {self.user.email}"

class ChatMessage(models.Model):
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    is_bot = models.BooleanField()
    message_type = models.CharField(max_length=20, choices=[
        ('text', 'Text'),
        ('suggestion', 'Suggestion'),
        ('action', 'Action'),
    ], default='text')
    action_data = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'chat_messages'

    def __str__(self):
        return f"{'Bot' if self.is_bot else 'User'}: {self.content[:30]}..."

class UserPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    theme = models.CharField(max_length=20, choices=[
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System'),
    ], default='system')
    language = models.CharField(max_length=5, default='fr')
    dashboard_widgets = models.JSONField(default=list)
    start_page = models.CharField(max_length=50, default='dashboard')
    export_format = models.CharField(max_length=20, choices=[
        ('csv', 'CSV'),
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
    ], default='excel')

    class Meta:
        db_table = 'user_preferences'

    def __str__(self):
        return f"Preferences for {self.user.email}"

class FinancialInsight(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    insight_type = models.CharField(max_length=50, choices=[
        ('spending_pattern', 'Spending Pattern'),
        ('saving_opportunity', 'Saving Opportunity'),
        ('budget_suggestion', 'Budget Suggestion'),
        ('anomaly_detection', 'Anomaly Detection'),
        ('forecast_alert', 'Forecast Alert'),
        ('custom', 'Custom'),
    ])
    priority = models.IntegerField()
    viewed = models.BooleanField(default=False)
    related_data = models.JSONField(default=dict)

    class Meta:
        db_table = 'financial_insights'
        indexes = [
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.title