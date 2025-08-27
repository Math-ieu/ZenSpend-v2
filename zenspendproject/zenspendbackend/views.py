from django.shortcuts import render
from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.hashers import make_password
from .models import *
from .serializers import *
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count
from django.utils.dateparse import parse_date
from datetime import datetime, timedelta
from decimal import Decimal
User = get_user_model()
import logging

logger = logging.getLogger(__name__)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as e:
            # Log l'erreur pour débogage
            logger.error(f"Erreur de validation: {e.detail}")
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            try:
                user = serializer.save()
                return Response({
                    'status': 'success',
                    'status_code': 201,
                    'message': 'Utilisateur créé avec succès',
                    'data': {
                        'user': {
                            'id': user.id,
                            'email': user.email,
                            'first_name': user.first_name,
                            'last_name': user.last_name,
                            'phone_number': user.phone_number,
                            'preferred_currency': user.preferred_currency,
                        }
                    }
                }, 
                status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'status': 'error',
                    'status_code': 500,
                    'message': 'Erreur lors de la création de l\'utilisateur',
                    'error': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Formater les erreurs de validation
            formatted_errors = {}
            for field, errors in serializer.errors.items():
                formatted_errors[field] = errors if isinstance(errors, list) else [str(errors)]
            
            return Response({
                'status': 'error',
                'status_code': 400,
                'message': 'Données invalides',
                'errors': formatted_errors
            }, status=status.HTTP_400_BAD_REQUEST)



class UserLogoutView(APIView): 
    permission_classes = [IsAuthenticated]
    
    def post(self, request): 
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                return Response({'message': 'Déconnexion réussie'}, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Token de rafraîchissement requis'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Token invalide'}, status=status.HTTP_400_BAD_REQUEST) 



class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ==================== USER VIEWS ====================

class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Retourner seulement l'utilisateur connecté
        return User.objects.filter(id=self.request.user.id)


class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


# ==================== BANK ACCOUNT VIEWS ====================

class BankAccountListCreateView(generics.ListCreateAPIView):
    serializer_class = BankAccountSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        return BankAccount.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BankAccountDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BankAccountSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return BankAccount.objects.filter(user=self.request.user)


# ==================== CATEGORY VIEWS ====================

class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_expense', 'is_tax_deductible', 'parent_category']
    
    def get_queryset(self):
        return Category.objects.filter(
            Q(user=self.request.user) | Q(is_system=True)
        )
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)


# ==================== TAG VIEWS ====================

class TagListCreateView(generics.ListCreateAPIView):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    
    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TagDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)


# ==================== TRANSACTION VIEWS ====================

class TransactionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'account', 'status', 'is_recurring']
    search_fields = ['description', 'payee', 'notes']
    ordering_fields = ['date', 'amount']
    ordering = ['-date']
    
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).select_related(
            'category', 'account'
        ).prefetch_related('tags')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)


# ==================== TRANSACTION RULE VIEWS ====================

class TransactionRuleListCreateView(generics.ListCreateAPIView):
    serializer_class = TransactionRuleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'keywords']
    
    def get_queryset(self):
        return TransactionRule.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionRuleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransactionRuleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TransactionRule.objects.filter(user=self.request.user)


# ==================== BUDGET VIEWS ====================

class BudgetListCreateView(generics.ListCreateAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_recurring']
    ordering_fields = ['start_date', 'amount']
    ordering = ['-start_date']
    
    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)


# ==================== SAVINGS GOAL VIEWS ====================

class SavingsGoalListCreateView(generics.ListCreateAPIView):
    serializer_class = SavingsGoalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['deadline', 'target_amount']
    ordering = ['deadline']
    
    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SavingsGoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SavingsGoalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SavingsGoal.objects.filter(user=self.request.user)


# ==================== DEBT TRACKER VIEWS ====================

class DebtTrackerListCreateView(generics.ListCreateAPIView):
    serializer_class = DebtTrackerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['payment_due_date', 'remaining_amount']
    ordering = ['payment_due_date']
    
    def get_queryset(self):
        return DebtTracker.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DebtTrackerDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DebtTrackerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return DebtTracker.objects.filter(user=self.request.user)


# ==================== SHARED BUDGET VIEWS ====================

class SharedBudgetListCreateView(generics.ListCreateAPIView):
    serializer_class = SharedBudgetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SharedBudget.objects.filter(
            Q(owner=self.request.user) | Q(members=self.request.user)
        ).distinct()
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class SharedBudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SharedBudgetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SharedBudget.objects.filter(
            Q(owner=self.request.user) | Q(members=self.request.user)
        ).distinct()


# ==================== DEBT RECORD VIEWS ====================

class DebtRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = DebtRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_settled']
    ordering_fields = ['due_date', 'amount']
    ordering = ['due_date']
    
    def get_queryset(self):
        return DebtRecord.objects.filter(
            Q(creditor=self.request.user) | Q(debtor=self.request.user)
        )


class DebtRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DebtRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return DebtRecord.objects.filter(
            Q(creditor=self.request.user) | Q(debtor=self.request.user)
        )


# ==================== NOTIFICATION VIEWS ====================

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_read', 'type', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


# ==================== FINANCIAL SNAPSHOT VIEWS ====================

class FinancialSnapshotListCreateView(generics.ListCreateAPIView):
    serializer_class = FinancialSnapshotSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-date']
    
    def get_queryset(self):
        return FinancialSnapshot.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FinancialSnapshotDetailView(generics.RetrieveAPIView):
    serializer_class = FinancialSnapshotSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return FinancialSnapshot.objects.filter(user=self.request.user)


# ==================== IMPORT SESSION VIEWS ====================

class ImportSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = ImportSessionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'source']
    ordering = ['-date_imported']
    
    def get_queryset(self):
        return ImportSession.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ImportSessionDetailView(generics.RetrieveAPIView):
    serializer_class = ImportSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ImportSession.objects.filter(user=self.request.user)


# ==================== ACHIEVEMENT VIEWS ====================

class AchievementListView(generics.ListAPIView):
    serializer_class = AchievementSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['achievement_type', 'level']
    ordering = ['-date_earned']
    
    def get_queryset(self):
        return Achievement.objects.filter(user=self.request.user)


class AchievementDetailView(generics.RetrieveAPIView):
    serializer_class = AchievementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Achievement.objects.filter(user=self.request.user)


# ==================== CHALLENGE VIEWS ====================

class ChallengeListCreateView(generics.ListCreateAPIView):
    serializer_class = ChallengeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['challenge_type', 'is_completed']
    ordering = ['-start_date']
    
    def get_queryset(self):
        return Challenge.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChallengeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ChallengeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Challenge.objects.filter(user=self.request.user)


# ==================== FINANCIAL REPORT VIEWS ====================

class FinancialReportListCreateView(generics.ListCreateAPIView):
    serializer_class = FinancialReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['report_type', 'is_scheduled']
    ordering = ['-generation_date']
    
    def get_queryset(self):
        return FinancialReport.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FinancialReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FinancialReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return FinancialReport.objects.filter(user=self.request.user)


# ==================== CHAT SESSION VIEWS ====================

class ChatSessionListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_active']
    ordering = ['-last_activity']
    
    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChatSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)


# ==================== CHAT MESSAGE VIEWS ====================

class ChatMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['session', 'is_bot', 'message_type']
    ordering = ['timestamp']
    
    def get_queryset(self):
        return ChatMessage.objects.filter(session__user=self.request.user)


class ChatMessageDetailView(generics.RetrieveAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChatMessage.objects.filter(session__user=self.request.user)


# ==================== USER PREFERENCE VIEWS ====================

class UserPreferenceDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserPreferenceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        preference, created = UserPreference.objects.get_or_create(
            user=self.request.user
        )
        return preference


# ==================== FINANCIAL INSIGHT VIEWS ====================

class FinancialInsightListView(generics.ListAPIView):
    serializer_class = FinancialInsightSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['insight_type', 'priority', 'viewed']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return FinancialInsight.objects.filter(user=self.request.user)


class FinancialInsightDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = FinancialInsightSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return FinancialInsight.objects.filter(user=self.request.user)


# ==================== SUBSCRIPTION VIEWS ====================

class SubscriptionListView(generics.ListAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user)


class SubscriptionDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user)


# ==================== RECEIPT VIEWS ====================

class ReceiptListCreateView(generics.ListCreateAPIView):
    serializer_class = ReceiptSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-date_added']
    
    def get_queryset(self):
        return Receipt.objects.filter(transaction__user=self.request.user)


class ReceiptDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReceiptSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Receipt.objects.filter(transaction__user=self.request.user)


# ==================== RECURRING SCHEDULE VIEWS ====================

class RecurringScheduleListCreateView(generics.ListCreateAPIView):
    serializer_class = RecurringScheduleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['frequency']
    ordering = ['next_occurrence']
    
    def get_queryset(self):
        return RecurringSchedule.objects.filter(
            Q(transaction__user=self.request.user) | 
            Q(budget__user=self.request.user)
        ).distinct()


class RecurringScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RecurringScheduleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return RecurringSchedule.objects.filter(
            Q(transaction__user=self.request.user) | 
            Q(budget__user=self.request.user)
        ).distinct()