from mongoengine import Document, EmbeddedDocument, fields, CASCADE
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
import datetime
from decimal import Decimal


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email est obligatoire')
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_admin', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, Document):
    email = fields.EmailField(unique=True)
    first_name = fields.StringField(max_length=50)
    last_name = fields.StringField(max_length=50)
    profile_pic = fields.StringField()
    phone_number = fields.StringField(max_length=15)
    is_active = fields.BooleanField(default=True)
    is_admin = fields.BooleanField(default=False)
    created_at = fields.DateTimeField(default=datetime.datetime.now)
    preferred_currency = fields.StringField(max_length=3, default='EUR')  # Devise par défaut
    notification_preferences = fields.DictField(default={'email': True, 'app': True, 'budget_alerts': True})
    
    # Réglages Django Auth 
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    objects = UserManager()
    
    meta = {'collection': 'users'}
    
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


class BankAccount(Document):
    name = fields.StringField(max_length=100, required=True)
    account_number = fields.StringField(max_length=50)  # Peut être masqué/chiffré pour sécurité
    balance = fields.DecimalField(default=0, precision=2)
    currency = fields.StringField(max_length=3, default='EUR')
    account_type = fields.StringField(choices=['checking', 'savings', 'credit', 'investment', 'cash', 'other'])
    user = fields.ReferenceField(User, required=True)
    institution = fields.StringField(max_length=100)
    is_active = fields.BooleanField(default=True)
    last_sync = fields.DateTimeField()
    connection_details = fields.DictField()  # Pour API bancaire (devrait être chiffré)
    
    meta = {'collection': 'bank_accounts'}
    
    def __str__(self):
        return f"{self.name} ({self.account_type})"


class Category(Document):
    name = fields.StringField(max_length=100, required=True)
    icon = fields.StringField()
    color = fields.StringField(max_length=7)  # Format hexadécimal #RRGGBB
    user = fields.ReferenceField(User)
    is_expense = fields.BooleanField(default=True)  # True pour dépense, False pour revenu
    is_tax_deductible = fields.BooleanField(default=False)
    parent_category = fields.ReferenceField('self', null=True)  # Pour sous-catégories
    is_system = fields.BooleanField(default=False)  # Catégories système non supprimables
    
    meta = {'collection': 'categories'}
    
    def __str__(self):
        return self.name


class Tag(Document):
    name = fields.StringField(max_length=50, required=True)
    user = fields.ReferenceField(User, required=True)
    color = fields.StringField(max_length=7)
    
    meta = {'collection': 'tags', 'indexes': [{'fields': ['name', 'user'], 'unique': True}]}
    
    def __str__(self):
        return self.name


class Receipt(EmbeddedDocument):
    image_url = fields.StringField()
    ocr_text = fields.StringField()  # Texte extrait
    processed_data = fields.DictField()  # Données structurées extraites
    date_added = fields.DateTimeField(default=datetime.datetime.now)


class RecurringSchedule(EmbeddedDocument):
    frequency = fields.StringField(choices=['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'])
    day_of_month = fields.IntField(min_value=1, max_value=31)
    day_of_week = fields.IntField(min_value=0, max_value=6)  # 0=Lundi, 6=Dimanche
    start_date = fields.DateTimeField(default=datetime.datetime.now)
    end_date = fields.DateTimeField()
    next_occurrence = fields.DateTimeField()


class Transaction(Document):
    amount = fields.DecimalField(required=True, precision=2)
    original_amount = fields.DecimalField(precision=2)  # Pour montant en devise originale
    original_currency = fields.StringField(max_length=3)
    description = fields.StringField(max_length=200)
    date = fields.DateTimeField(default=datetime.datetime.now)
    category = fields.ReferenceField(Category)
    tags = fields.ListField(fields.ReferenceField(Tag))
    user = fields.ReferenceField(User, required=True)
    account = fields.ReferenceField(BankAccount)
    is_recurring = fields.BooleanField(default=False)
    recurring_schedule = fields.EmbeddedDocumentField(RecurringSchedule)
    receipt = fields.EmbeddedDocumentField(Receipt)
    location = fields.GeoPointField()  # Coordonnées géographiques
    payee = fields.StringField(max_length=100)  # Destinataire/source du paiement
    status = fields.StringField(choices=['pending', 'cleared', 'reconciled'], default='cleared')
    notes = fields.StringField()
    is_split = fields.BooleanField(default=False)
    parent_transaction = fields.ReferenceField('self')  # Pour transactions fractionnées
    
    meta = {'collection': 'transactions', 'indexes': ['-date']}
    
    def __str__(self):
        return f"{self.description} - {self.amount}€"


class TransactionRule(Document):
    name = fields.StringField(max_length=100)
    user = fields.ReferenceField(User, required=True)
    keywords = fields.ListField(fields.StringField())
    amount_min = fields.DecimalField()
    amount_max = fields.DecimalField()
    payee = fields.StringField()
    assign_category = fields.ReferenceField(Category)
    assign_tags = fields.ListField(fields.ReferenceField(Tag))
    is_active = fields.BooleanField(default=True)
    
    meta = {'collection': 'transaction_rules'}
    
    def __str__(self):
        return self.name


class Budget(Document):
    name = fields.StringField(max_length=100, required=True)
    amount = fields.DecimalField(required=True, precision=2)
    start_date = fields.DateTimeField(default=datetime.datetime.now)
    end_date = fields.DateTimeField()
    user = fields.ReferenceField(User, required=True)
    categories = fields.ListField(fields.ReferenceField(Category))
    accounts = fields.ListField(fields.ReferenceField(BankAccount))
    is_recurring = fields.BooleanField(default=False)
    recurring_schedule = fields.EmbeddedDocumentField(RecurringSchedule)
    current_amount = fields.DecimalField(default=0, precision=2)  # Montant actuel dépensé
    alert_threshold = fields.DecimalField(default=80, precision=2)  # Alerte à 80% du budget
    
    meta = {'collection': 'budgets'}
    
    def __str__(self):
        return self.name
    
    @property
    def percentage_used(self):
        if self.amount == 0:
            return 0
        return (self.current_amount / self.amount) * 100


class SavingsGoal(Document):
    name = fields.StringField(max_length=100, required=True)
    target_amount = fields.DecimalField(required=True, precision=2)
    current_amount = fields.DecimalField(default=0, precision=2)
    deadline = fields.DateTimeField()
    user = fields.ReferenceField(User, required=True)
    icon = fields.StringField()
    account = fields.ReferenceField(BankAccount)
    auto_save = fields.BooleanField(default=False)
    auto_save_amount = fields.DecimalField(precision=2)
    auto_save_frequency = fields.StringField(choices=['daily', 'weekly', 'monthly'])
    notes = fields.StringField()
    
    meta = {'collection': 'savings_goals'}
    
    def __str__(self):
        return self.name
    
    @property
    def percentage_complete(self):
        if self.target_amount == 0:
            return 0
        return (self.current_amount / self.target_amount) * 100


class DebtTracker(Document):
    name = fields.StringField(max_length=100, required=True)
    total_amount = fields.DecimalField(required=True, precision=2)
    remaining_amount = fields.DecimalField(required=True, precision=2)
    interest_rate = fields.DecimalField(precision=4)
    minimum_payment = fields.DecimalField(precision=2)
    payment_due_date = fields.IntField(min_value=1, max_value=31)  # Jour du mois
    lender = fields.StringField(max_length=100)
    user = fields.ReferenceField(User, required=True)
    account = fields.ReferenceField(BankAccount)
    
    meta = {'collection': 'debt_trackers'}
    
    def __str__(self):
        return self.name


class SharedBudget(Document):
    name = fields.StringField(max_length=100, required=True)
    owner = fields.ReferenceField(User, required=True)
    members = fields.ListField(fields.ReferenceField(User))
    amount = fields.DecimalField(required=True, precision=2)
    start_date = fields.DateTimeField(default=datetime.datetime.now)
    end_date = fields.DateTimeField()
    categories = fields.ListField(fields.ReferenceField(Category))
    current_amount = fields.DecimalField(default=0, precision=2)
    
    meta = {'collection': 'shared_budgets'}
    
    def __str__(self):
        return self.name


class DebtRecord(Document):
    creditor = fields.ReferenceField(User, required=True)  # Qui a prêté
    debtor = fields.ReferenceField(User, required=True)    # Qui doit rembourser
    amount = fields.DecimalField(required=True, precision=2)
    description = fields.StringField(max_length=200)
    date_created = fields.DateTimeField(default=datetime.datetime.now)
    due_date = fields.DateTimeField()
    is_settled = fields.BooleanField(default=False)
    settled_date = fields.DateTimeField()
    related_transaction = fields.ReferenceField(Transaction)
    
    meta = {'collection': 'debt_records'}
    
    def __str__(self):
        return f"{self.debtor.full_name} doit {self.amount}€ à {self.creditor.full_name}"


class Notification(Document):
    user = fields.ReferenceField(User, required=True)
    title = fields.StringField(max_length=100)
    message = fields.StringField()
    created_at = fields.DateTimeField(default=datetime.datetime.now)
    is_read = fields.BooleanField(default=False)
    type = fields.StringField(choices=[
        'budget_alert', 'goal_reached', 'recurring_payment', 
        'system_message', 'debt_reminder', 'category_suggestion',
        'unusual_activity', 'milestone', 'weekly_summary'
    ])
    priority = fields.StringField(choices=['low', 'medium', 'high'], default='medium')
    related_object_id = fields.StringField()  # ID de l'objet concerné
    action_url = fields.StringField()  # URL relative dans l'app pour action directe
    
    meta = {'collection': 'notifications', 'indexes': ['-created_at']}
    
    def __str__(self):
        return self.title


class FinancialSnapshot(Document):
    user = fields.ReferenceField(User, required=True)
    date = fields.DateTimeField(default=datetime.datetime.now)
    total_assets = fields.DecimalField(precision=2)
    total_liabilities = fields.DecimalField(precision=2)
    net_worth = fields.DecimalField(precision=2)
    total_income_mtd = fields.DecimalField(precision=2)  # Month to date
    total_expenses_mtd = fields.DecimalField(precision=2)
    accounts_snapshot = fields.DictField()  # {account_id: balance}
    
    meta = {'collection': 'financial_snapshots', 'indexes': ['-date']}
    
    def __str__(self):
        return f"Snapshot {self.date.strftime('%Y-%m-%d')}"


class ImportSession(Document):
    user = fields.ReferenceField(User, required=True)
    source = fields.StringField(choices=['csv', 'ofx', 'pdf', 'api', 'manual'])
    date_imported = fields.DateTimeField(default=datetime.datetime.now)
    account = fields.ReferenceField(BankAccount)
    file_name = fields.StringField()
    status = fields.StringField(choices=['pending', 'processing', 'completed', 'failed'])
    error_message = fields.StringField()
    transactions_count = fields.IntField(default=0)
    duplicates_count = fields.IntField(default=0)
    
    meta = {'collection': 'import_sessions'}
    
    def __str__(self):
        return f"Import {self.date_imported.strftime('%Y-%m-%d %H:%M')} - {self.source}"


class Achievement(Document):
    user = fields.ReferenceField(User, required=True)
    name = fields.StringField(max_length=100)
    description = fields.StringField()
    icon = fields.StringField()
    date_earned = fields.DateTimeField(default=datetime.datetime.now)
    achievement_type = fields.StringField(choices=[
        'saving_streak', 'budget_complete', 'first_goal', 'categorization_master',
        'data_entry', 'app_usage', 'financial_literacy', 'custom'
    ])
    level = fields.IntField(default=1)  # Pour badges à niveaux multiples
    
    meta = {'collection': 'achievements'}
    
    def __str__(self):
        return self.name


class Challenge(Document):
    name = fields.StringField(max_length=100, required=True)
    description = fields.StringField()
    start_date = fields.DateTimeField()
    end_date = fields.DateTimeField()
    target_value = fields.DecimalField(precision=2)
    current_value = fields.DecimalField(default=0, precision=2)
    challenge_type = fields.StringField(choices=[
        'reduce_spending', 'increase_saving', 'category_budget',
        'no_spend', 'debt_reduction', 'custom'
    ])
    category = fields.ReferenceField(Category)
    user = fields.ReferenceField(User, required=True)
    is_completed = fields.BooleanField(default=False)
    
    meta = {'collection': 'challenges'}
    
    def __str__(self):
        return self.name


class FinancialReport(Document):
    user = fields.ReferenceField(User, required=True)
    title = fields.StringField(max_length=100)
    report_type = fields.StringField(choices=[
        'monthly_summary', 'annual_review', 'tax_report', 'category_analysis',
        'forecast', 'net_worth', 'custom'
    ])
    date_range_start = fields.DateTimeField()
    date_range_end = fields.DateTimeField()
    generation_date = fields.DateTimeField(default=datetime.datetime.now)
    data = fields.DictField()  # Données du rapport
    is_scheduled = fields.BooleanField(default=False)
    schedule_frequency = fields.StringField(choices=['weekly', 'monthly', 'quarterly', 'yearly'])
    
    meta = {'collection': 'financial_reports'}
    
    def __str__(self):
        return self.title


class ChatSession(Document):
    user = fields.ReferenceField(User, required=True)
    started_at = fields.DateTimeField(default=datetime.datetime.now)
    last_activity = fields.DateTimeField(default=datetime.datetime.now)
    is_active = fields.BooleanField(default=True)
    context = fields.DictField()  # Contexte pour l'IA
    
    meta = {'collection': 'chat_sessions'}
    
    def __str__(self):
        return f"Session {self.id} - {self.user.email}"


class ChatMessage(Document):
    session = fields.ReferenceField(ChatSession, required=True)
    content = fields.StringField(required=True)
    timestamp = fields.DateTimeField(default=datetime.datetime.now)
    is_bot = fields.BooleanField()  # True si message de l'assistant, False si message utilisateur
    message_type = fields.StringField(choices=['text', 'suggestion', 'action'], default='text')
    action_data = fields.DictField()  # Pour messages de type action
    
    meta = {'collection': 'chat_messages'}
    
    def __str__(self):
        return f"{'Bot' if self.is_bot else 'User'}: {self.content[:30]}..."


class UserPreference(Document):
    user = fields.ReferenceField(User, required=True)
    theme = fields.StringField(choices=['light', 'dark', 'system'], default='system')
    language = fields.StringField(default='fr')
    dashboard_widgets = fields.ListField(fields.StringField())  # Liste ordonnée des widgets
    start_page = fields.StringField(default='dashboard')
    export_format = fields.StringField(choices=['csv', 'pdf', 'excel'], default='excel')
    
    meta = {'collection': 'user_preferences'}
    
    def __str__(self):
        return f"Preferences for {self.user.email}"


class FinancialInsight(Document):
    user = fields.ReferenceField(User, required=True)
    title = fields.StringField()
    description = fields.StringField()
    created_at = fields.DateTimeField(default=datetime.datetime.now)
    insight_type = fields.StringField(choices=[
        'spending_pattern', 'saving_opportunity', 'budget_suggestion',
        'anomaly_detection', 'forecast_alert', 'custom'
    ])
    priority = fields.IntField(min_value=1, max_value=10)  # Plus le chiffre est élevé, plus c'est important
    viewed = fields.BooleanField(default=False)
    related_data = fields.DictField()  # Données spécifiques à l'insight
    
    meta = {'collection': 'financial_insights', 'indexes': ['-created_at']}
    
    def __str__(self):
        return self.title