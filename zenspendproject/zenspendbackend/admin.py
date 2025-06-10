# admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta

from .models import (
    User, BankAccount, Category, Tag, Transaction, Receipt, 
    RecurringSchedule, TransactionRule, Budget, SavingsGoal, 
    DebtTracker, SharedBudget, DebtRecord, Notification, 
    FinancialSnapshot, ImportSession, Achievement, Challenge, 
    FinancialReport, ChatSession, ChatMessage, UserPreference, 
    FinancialInsight
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'full_name', 'last_name', 'is_active', 'is_admin', 'created_at', 'transaction_count', 'total_balance')
    list_filter = ('is_active', 'is_admin', 'created_at', 'preferred_currency')
    search_fields = ('email', 'full_name', 'last_name')
    ordering = ('-created_at',)
    filter_horizontal = ()
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informations personnelles', {'fields': ('full_name', 'last_name', 'profile_pic', 'phone_number')}),
        ('Préférences', {'fields': ('preferred_currency', 'notification_preferences')}),
        ('Permissions', {'fields': ('is_active', 'is_admin')}),
        ('Dates importantes', {'fields': ('created_at',)}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'last_name', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('created_at',)
    
    def transaction_count(self, obj):
        count = Transaction.objects.filter(user=obj).count()
        return format_html('<span style="color: #0066cc;">{}</span>', count)
    transaction_count.short_description = 'Transactions'
    
    def total_balance(self, obj):
        total = BankAccount.objects.filter(user=obj, is_active=True).aggregate(
            total=Sum('balance'))['total'] or 0
        return format_html('<span style="color: #006600;">{:.2f} {}</span>', 
                          total, obj.preferred_currency)
    total_balance.short_description = 'Solde total'


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'account_type', 'balance', 'currency', 'is_active', 'last_sync')
    list_filter = ('account_type', 'currency', 'is_active', 'institution')
    search_fields = ('name', 'user__email', 'account_number', 'institution')
    readonly_fields = ('last_sync',)
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('name', 'user', 'account_type', 'institution')
        }),
        ('Détails financiers', {
            'fields': ('balance', 'currency', 'account_number')
        }),
        ('Statut', {
            'fields': ('is_active', 'last_sync')
        }),
        ('Connexion', {
            'fields': ('connection_details',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_expense', 'is_tax_deductible', 'is_system', 'parent_category', 'color_preview')
    list_filter = ('is_expense', 'is_tax_deductible', 'is_system')
    search_fields = ('name', 'user__email')
    list_editable = ('is_expense', 'is_tax_deductible')
    
    def color_preview(self, obj):
        if obj.color:
            return format_html(
                '<div style="width: 20px; height: 20px; background-color: {}; border-radius: 50%;"></div>',
                obj.color
            )
        return '-'
    color_preview.short_description = 'Couleur'


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('description', 'user', 'amount', 'currency_display', 'category', 'date', 'status', 'account')
    list_filter = ('status', 'category', 'date', 'is_recurring', 'is_split')
    search_fields = ('description', 'user__email', 'payee')
    date_hierarchy = 'date'
    readonly_fields = ('created_display',)
    
    fieldsets = (
        ('Transaction', {
            'fields': ('user', 'account', 'description', 'amount', 'date', 'status')
        }),
        ('Catégorisation', {
            'fields': ('category', 'tags', 'payee')
        }),
        ('Détails', {
            'fields': ('notes', 'location', 'is_recurring', 'is_split', 'parent_transaction')
        }),
        ('Devise originale', {
            'fields': ('original_amount', 'original_currency'),
            'classes': ('collapse',)
        }),
    )
    
    def currency_display(self, obj):
        if obj.original_currency and obj.original_currency != 'EUR':
            return format_html('{} EUR ({})', obj.amount, obj.original_currency)
        return f"{obj.amount} EUR"
    currency_display.short_description = 'Montant'
    
    def created_display(self, obj):
        return obj.date.strftime('%d/%m/%Y %H:%M')
    created_display.short_description = 'Date de création'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'category', 'account')


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'amount', 'current_amount', 'percentage_used_display', 'start_date', 'end_date', 'is_recurring')
    list_filter = ('is_recurring', 'start_date')
    search_fields = ('name', 'user__email')
    filter_horizontal = ('categories', 'accounts')
    
    def percentage_used_display(self, obj):
        percentage = obj.percentage_used
        if percentage > 100:
            color = '#ff0000'  # Rouge
        elif percentage > 80:
            color = '#ff9900'  # Orange
        else:
            color = '#00cc00'  # Vert
        
        return format_html(
            '<div style="width: 100px; background-color: #f0f0f0; border-radius: 10px;">'
            '<div style="width: {}%; background-color: {}; height: 20px; border-radius: 10px; text-align: center; color: white;">'
            '{:.1f}%</div></div>',
            min(percentage, 100), color, percentage
        )
    percentage_used_display.short_description = 'Utilisation'


@admin.register(SavingsGoal)
class SavingsGoalAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'target_amount', 'current_amount', 'percentage_complete_display', 'deadline', 'auto_save')
    list_filter = ('auto_save', 'auto_save_frequency', 'deadline')
    search_fields = ('name', 'user__email')
    
    def percentage_complete_display(self, obj):
        percentage = obj.percentage_complete
        color = '#00cc00' if percentage >= 100 else '#0066cc'
        
        return format_html(
            '<div style="width: 100px; background-color: #f0f0f0; border-radius: 10px;">'
            '<div style="width: {}%; background-color: {}; height: 20px; border-radius: 10px; text-align: center; color: white;">'
            '{:.1f}%</div></div>',
            min(percentage, 100), color, percentage
        )
    percentage_complete_display.short_description = 'Progression'


@admin.register(DebtTracker)
class DebtTrackerAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'total_amount', 'remaining_amount', 'interest_rate', 'minimum_payment', 'lender')
    list_filter = ('lender', 'payment_due_date')
    search_fields = ('name', 'user__email', 'lender')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'type', 'priority', 'created_at', 'is_read')
    list_filter = ('type', 'priority', 'is_read', 'created_at')
    search_fields = ('title', 'user__email', 'message')
    readonly_fields = ('created_at',)
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)
    mark_as_read.short_description = "Marquer comme lu"
    
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False)
    mark_as_unread.short_description = "Marquer comme non lu"


@admin.register(TransactionRule)
class TransactionRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'assign_category', 'is_active', 'keywords_display')
    list_filter = ('is_active', 'assign_category')
    search_fields = ('name', 'user__email')
    filter_horizontal = ('assign_tags',)
    
    def keywords_display(self, obj):
        if obj.keywords:
            return ', '.join(obj.keywords[:3]) + ('...' if len(obj.keywords) > 3 else '')
        return '-'
    keywords_display.short_description = 'Mots-clés'


@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('transaction', 'date_added', 'has_image', 'has_ocr_text')
    list_filter = ('date_added',)
    search_fields = ('transaction__description',)
    readonly_fields = ('date_added', 'ocr_text_preview')
    
    def has_image(self, obj):
        return bool(obj.image_url)
    has_image.boolean = True
    has_image.short_description = 'Image'
    
    def has_ocr_text(self, obj):
        return bool(obj.ocr_text)
    has_ocr_text.boolean = True
    has_ocr_text.short_description = 'Texte OCR'
    
    def ocr_text_preview(self, obj):
        if obj.ocr_text:
            return obj.ocr_text[:200] + ('...' if len(obj.ocr_text) > 200 else '')
        return '-'
    ocr_text_preview.short_description = 'Aperçu OCR'


@admin.register(FinancialSnapshot)
class FinancialSnapshotAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'net_worth', 'total_assets', 'total_liabilities', 'total_income_mtd', 'total_expenses_mtd')
    list_filter = ('date',)
    search_fields = ('user__email',)
    date_hierarchy = 'date'
    readonly_fields = ('date',)


@admin.register(ImportSession)
class ImportSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'source', 'date_imported', 'status', 'transactions_count', 'duplicates_count', 'file_name')
    list_filter = ('source', 'status', 'date_imported')
    search_fields = ('user__email', 'file_name')
    readonly_fields = ('date_imported',)


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'achievement_type', 'level', 'date_earned')
    list_filter = ('achievement_type', 'level', 'date_earned')
    search_fields = ('name', 'user__email')


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'challenge_type', 'target_value', 'current_value', 'progress_display', 'is_completed')
    list_filter = ('challenge_type', 'is_completed', 'start_date', 'end_date')
    search_fields = ('name', 'user__email')
    
    def progress_display(self, obj):
        if obj.target_value and obj.target_value > 0:
            percentage = (obj.current_value / obj.target_value) * 100
            color = '#00cc00' if percentage >= 100 else '#0066cc'
            
            return format_html(
                '<div style="width: 100px; background-color: #f0f0f0; border-radius: 10px;">'
                '<div style="width: {}%; background-color: {}; height: 20px; border-radius: 10px; text-align: center; color: white;">'
                '{:.1f}%</div></div>',
                min(percentage, 100), color, percentage
            )
        return '-'
    progress_display.short_description = 'Progression'


@admin.register(FinancialReport)
class FinancialReportAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'report_type', 'generation_date', 'is_scheduled', 'schedule_frequency')
    list_filter = ('report_type', 'is_scheduled', 'schedule_frequency', 'generation_date')
    search_fields = ('title', 'user__email')


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'theme', 'language', 'start_page', 'export_format')
    list_filter = ('theme', 'language', 'export_format')
    search_fields = ('user__email',)


@admin.register(FinancialInsight)
class FinancialInsightAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'insight_type', 'priority', 'created_at', 'viewed')
    list_filter = ('insight_type', 'priority', 'viewed', 'created_at')
    search_fields = ('title', 'user__email')
    readonly_fields = ('created_at',)


# Modèles simples sans personnalisation spéciale
admin.site.register(Tag)
admin.site.register(RecurringSchedule)
admin.site.register(SharedBudget)
admin.site.register(DebtRecord)
admin.site.register(ChatSession)
admin.site.register(ChatMessage)

# Configuration du site admin
admin.site.site_header = "ZenSpend Administration"
admin.site.site_title = "ZenSpend Admin"
admin.site.index_title = "Tableau de bord administrateur"