
from django.urls import path
from .views import *
from .integration_views import (
    BankIntegrationStatusView,
    BankLinkSessionCreateView,
    BankCallbackView,
    BankSyncTransactionsView,
    BankSyncFromProviderView,
)
from .sso_views import SSOProviderStartView, SSOProviderCallbackView
from rest_framework_simplejwt.views import (
    TokenRefreshView, 
)
from . import views

urlpatterns = [
    path('auth/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', UserLogoutView.as_view(), name='logout'),
    path('auth/sso/<str:provider>/', SSOProviderStartView.as_view(), name='sso-start'),
    path('auth/sso/<str:provider>/callback/', SSOProviderCallbackView.as_view(), name='sso-callback'),
    path('auth/password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # Inscription et gestion de compte
    path('auth/register/', UserRegistrationView.as_view(), name='register'),

    # ==================== CONTACT ====================
    path('contact/', views.ContactView.as_view(), name='contact'),

    # ==================== USER ENDPOINTS ====================
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/profile/', views.UserDetailView.as_view(), name='user-detail'),
    
    # ==================== BANK ACCOUNT ENDPOINTS ====================
    path('accounts/', views.BankAccountListCreateView.as_view(), name='account-list-create'),
    path('accounts/<int:pk>/', views.BankAccountDetailView.as_view(), name='account-detail'),
    
    # ==================== CATEGORY ENDPOINTS ====================
    path('categories/', views.CategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category-detail'),
    
    # ==================== TAG ENDPOINTS ====================
    path('tags/', views.TagListCreateView.as_view(), name='tag-list-create'),
    path('tags/<int:pk>/', views.TagDetailView.as_view(), name='tag-detail'),
    
    # ==================== TRANSACTION ENDPOINTS ====================
    path('transactions/', views.TransactionListCreateView.as_view(), name='transaction-list-create'),
    path('transactions/<int:pk>/', views.TransactionDetailView.as_view(), name='transaction-detail'),
    
    # ==================== TRANSACTION RULE ENDPOINTS ====================
    path('transaction-rules/', views.TransactionRuleListCreateView.as_view(), name='transaction-rule-list-create'),
    path('transaction-rules/<int:pk>/', views.TransactionRuleDetailView.as_view(), name='transaction-rule-detail'),
    
    # ==================== BUDGET ENDPOINTS ====================
    path('budgets/', views.BudgetListCreateView.as_view(), name='budget-list-create'),
    path('budgets/<int:pk>/', views.BudgetDetailView.as_view(), name='budget-detail'),
    
    # ==================== SAVINGS GOAL ENDPOINTS ====================
    path('savings-goals/', views.SavingsGoalListCreateView.as_view(), name='savings-goal-list-create'),
    path('savings-goals/<int:pk>/', views.SavingsGoalDetailView.as_view(), name='savings-goal-detail'),
    
    # ==================== DEBT TRACKER ENDPOINTS ====================
    path('debt-trackers/', views.DebtTrackerListCreateView.as_view(), name='debt-tracker-list-create'),
    path('debt-trackers/<int:pk>/', views.DebtTrackerDetailView.as_view(), name='debt-tracker-detail'),

    # ==================== HOUSEHOLD ENDPOINTS ====================
    path('households/', views.HouseholdListCreateView.as_view(), name='household-list-create'),
    path('households/<int:pk>/', views.HouseholdDetailView.as_view(), name='household-detail'),
    path('households/<int:household_id>/members/', views.HouseholdMemberListCreateView.as_view(), name='household-member-list-create'),
    path('households/<int:household_id>/members/<int:member_id>/', views.HouseholdMemberDetailView.as_view(), name='household-member-detail'),
    
    # ==================== SHARED BUDGET ENDPOINTS ====================
    path('shared-budgets/', views.SharedBudgetListCreateView.as_view(), name='shared-budget-list-create'),
    path('shared-budgets/<int:pk>/', views.SharedBudgetDetailView.as_view(), name='shared-budget-detail'),
    
    # ==================== DEBT RECORD ENDPOINTS ====================
    path('debt-records/', views.DebtRecordListCreateView.as_view(), name='debt-record-list-create'),
    path('debt-records/<int:pk>/', views.DebtRecordDetailView.as_view(), name='debt-record-detail'),
    
    # ==================== NOTIFICATION ENDPOINTS ====================
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/', views.NotificationDetailView.as_view(), name='notification-detail'),
    
    # ==================== FINANCIAL SNAPSHOT ENDPOINTS ====================
    path('financial-snapshots/', views.FinancialSnapshotListCreateView.as_view(), name='financial-snapshot-list-create'),
    path('financial-snapshots/<int:pk>/', views.FinancialSnapshotDetailView.as_view(), name='financial-snapshot-detail'),
    
    # ==================== IMPORT SESSION ENDPOINTS ====================
    path('import-sessions/', views.ImportSessionListCreateView.as_view(), name='import-session-list-create'),
    path('import-sessions/upload/', views.ImportSessionUploadView.as_view(), name='import-session-upload'),
    path('import-sessions/<int:pk>/', views.ImportSessionDetailView.as_view(), name='import-session-detail'),
    
    # ==================== ACHIEVEMENT ENDPOINTS ====================
    path('achievements/', views.AchievementListView.as_view(), name='achievement-list'),
    path('achievements/<int:pk>/', views.AchievementDetailView.as_view(), name='achievement-detail'),
    
    # ==================== CHALLENGE ENDPOINTS ====================
    path('challenges/', views.ChallengeListCreateView.as_view(), name='challenge-list-create'),
    path('challenges/<int:pk>/', views.ChallengeDetailView.as_view(), name='challenge-detail'),
    
    # ==================== FINANCIAL REPORT ENDPOINTS ====================
    path('financial-reports/', views.FinancialReportListCreateView.as_view(), name='financial-report-list-create'),
    path('financial-reports/<int:pk>/', views.FinancialReportDetailView.as_view(), name='financial-report-detail'),
    
    # ==================== CHAT SESSION ENDPOINTS ====================
    path('chat-sessions/', views.ChatSessionListCreateView.as_view(), name='chat-session-list-create'),
    path('chat-sessions/<int:pk>/', views.ChatSessionDetailView.as_view(), name='chat-session-detail'),
    
    # ==================== CHAT MESSAGE ENDPOINTS ====================
    path('chat-messages/', views.ChatMessageListCreateView.as_view(), name='chat-message-list-create'),
    path('chat-messages/<int:pk>/', views.ChatMessageDetailView.as_view(), name='chat-message-detail'),
    
    # ==================== USER PREFERENCE ENDPOINTS ====================
    path('user-preferences/', views.UserPreferenceDetailView.as_view(), name='user-preference-detail'),
    
    # ==================== FINANCIAL INSIGHT ENDPOINTS ====================
    path('financial-insights/', views.FinancialInsightListView.as_view(), name='financial-insight-list'),
    path('financial-insights/<int:pk>/', views.FinancialInsightDetailView.as_view(), name='financial-insight-detail'),
    
    # ==================== SUBSCRIPTION ENDPOINTS ====================
    path('subscriptions/', views.SubscriptionListView.as_view(), name='subscription-list'),
    path('subscriptions/<int:pk>/', views.SubscriptionDetailView.as_view(), name='subscription-detail'),
    
    # ==================== RECEIPT ENDPOINTS ====================
    path('receipts/', views.ReceiptListCreateView.as_view(), name='receipt-list-create'),
    path('receipts/<int:pk>/', views.ReceiptDetailView.as_view(), name='receipt-detail'),
    
    # ==================== RECURRING SCHEDULE ENDPOINTS ====================
    path('recurring-schedules/', views.RecurringScheduleListCreateView.as_view(), name='recurring-schedule-list-create'),
    path('recurring-schedules/<int:pk>/', views.RecurringScheduleDetailView.as_view(), name='recurring-schedule-detail'),
    
    # ==================== DASHBOARD & ANALYTICS ENDPOINTS ====================
    path('dashboard/', views.DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('analytics/monthly-expenses/', views.AnalyticsMonthlyExpensesView.as_view(), name='analytics-monthly-expenses'),
    path('analytics/category-distribution/', views.AnalyticsCategoryDistributionView.as_view(), name='analytics-category-distribution'),

    # ==================== BANK INTEGRATION ENDPOINTS ====================
    path('integrations/banking/status/', BankIntegrationStatusView.as_view(), name='bank-integration-status'),
    path('integrations/banking/link-session/', BankLinkSessionCreateView.as_view(), name='bank-link-session-create'),
    path('integrations/banking/callback/', BankCallbackView.as_view(), name='bank-callback'),
    path('integrations/banking/sync/', BankSyncTransactionsView.as_view(), name='bank-sync-transactions'),
    path('integrations/banking/sync-from-provider/', BankSyncFromProviderView.as_view(), name='bank-sync-from-provider'),
    
]


