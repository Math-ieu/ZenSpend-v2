from django.shortcuts import render
from rest_framework import generics, status, filters, throttling
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
from django.conf import settings
from django.core import signing
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, Count
from django.utils.dateparse import parse_date
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import hashlib
from .services.email_delivery import send_password_reset_email, send_contact_email
from .services.categorization import apply_rules_to_transaction
from .services.csv_import import import_transactions_from_csv, CSVImportError
from .services.notifications import check_budget_alerts, check_goals_reached
User = get_user_model()
import logging

logger = logging.getLogger(__name__)


def _password_reset_fingerprint(user):
    return hashlib.sha256(user.password.encode('utf-8')).hexdigest()[:24]


def _segment_to_slug(segment):
    segment_map = {
        'couples': 'couples',
        'young_professionals': 'young-professionals',
        'families': 'families',
    }
    return segment_map.get(segment, 'young-professionals')


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
                            'user_segment': user.user_segment,
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


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email'].strip().lower()
        requested_segment = serializer.validated_data.get('user_segment')
        user = User.objects.filter(email__iexact=email).first()

        response_payload = {
            'status': 'success',
            'message': 'Si un compte existe, un lien de reinitialisation a ete genere.',
        }

        if user:
            token = signing.dumps(
                {
                    'user_id': user.id,
                    'fp': _password_reset_fingerprint(user),
                },
                salt='password-reset',
            )
            effective_segment = requested_segment or user.user_segment
            reset_url = (
                f"{settings.FRONTEND_RESET_PASSWORD_URL.rstrip('/')}/"
                f"{_segment_to_slug(effective_segment)}?token={token}"
            )
            send_password_reset_email(user.email, reset_url)

            if settings.PASSWORD_RESET_EXPOSE_LINK:
                response_payload['reset_url'] = reset_url

        return Response(response_payload, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']

        try:
            token_data = signing.loads(
                token,
                salt='password-reset',
                max_age=settings.PASSWORD_RESET_TOKEN_MAX_AGE_SECONDS,
            )
        except signing.SignatureExpired:
            return Response(
                {'status': 'error', 'message': 'Le lien de reinitialisation a expire.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except signing.BadSignature:
            return Response(
                {'status': 'error', 'message': 'Le token de reinitialisation est invalide.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_id = token_data.get('user_id')
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response(
                {'status': 'error', 'message': 'Utilisateur introuvable.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expected_fingerprint = token_data.get('fp')
        if expected_fingerprint != _password_reset_fingerprint(user):
            return Response(
                {'status': 'error', 'message': 'Ce lien de reinitialisation n est plus valide.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])

        return Response(
            {'status': 'success', 'message': 'Votre mot de passe a ete reinitialise avec succes.'},
            status=status.HTTP_200_OK,
        )



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


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def destroy(self, request, *args, **kwargs):
        """Suppression de compte (soft delete).

        Le compte est désactivé immédiatement (l'utilisateur ne peut plus se
        connecter) et marqué pour purge. La suppression définitive des données
        est effectuée après un délai par `manage.py purge_deleted_accounts`.
        """
        user = self.get_object()
        user.is_active = False
        user.deletion_requested_at = timezone.now()
        user.save(update_fields=['is_active', 'deletion_requested_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)


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
        transaction = serializer.save(user=self.request.user)
        # Auto-categorize from the user's active rules when no category was given.
        apply_rules_to_transaction(transaction)
        # Surface budget / goal notifications opportunistically.
        try:
            check_budget_alerts(self.request.user)
            check_goals_reached(self.request.user)
        except Exception:  # pragma: no cover - notifications must never block writes
            logger.exception('Notification check failed after transaction create')


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

    def perform_update(self, serializer):
        budget = serializer.save()
        # Spending may have changed; re-check this budget's alert threshold.
        try:
            check_budget_alerts(self.request.user, budgets=[budget])
        except Exception:  # pragma: no cover
            logger.exception('Notification check failed after budget update')


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

    def perform_update(self, serializer):
        goal = serializer.save()
        # The goal may have just reached its target.
        try:
            check_goals_reached(self.request.user, goals=[goal])
        except Exception:  # pragma: no cover
            logger.exception('Notification check failed after goal update')


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


def _household_queryset_for_user(user):
    return Household.objects.filter(
        Q(owner=user) | Q(memberships__user=user, memberships__is_active=True)
    ).distinct()


def _can_manage_household(user, household):
    if household.owner_id == user.id:
        return True

    return HouseholdMember.objects.filter(
        household=household,
        user=user,
        is_active=True,
        role__in=[
            HouseholdMember.ROLE_OWNER,
            HouseholdMember.ROLE_PARENT,
            HouseholdMember.ROLE_PARTNER,
        ],
    ).exists()


# ==================== HOUSEHOLD VIEWS ====================

class HouseholdListCreateView(generics.ListCreateAPIView):
    serializer_class = HouseholdSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _household_queryset_for_user(self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        household = serializer.save(
            owner=self.request.user,
            currency=self.request.user.preferred_currency or 'EUR',
        )
        membership, _ = HouseholdMember.objects.get_or_create(
            household=household,
            user=self.request.user,
            defaults={
                'role': HouseholdMember.ROLE_OWNER,
                'is_active': True,
            },
        )
        if membership.role != HouseholdMember.ROLE_OWNER or not membership.is_active:
            membership.role = HouseholdMember.ROLE_OWNER
            membership.is_active = True
            membership.save(update_fields=['role', 'is_active'])


class HouseholdDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HouseholdSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return _household_queryset_for_user(self.request.user)

    def destroy(self, request, *args, **kwargs):
        household = self.get_object()
        if household.owner_id != request.user.id:
            return Response(
                {'message': 'Seul le proprietaire peut supprimer le foyer.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)


class HouseholdMemberListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get_household(self, request, household_id):
        return get_object_or_404(_household_queryset_for_user(request.user), id=household_id)

    def get(self, request, household_id):
        household = self.get_household(request, household_id)
        memberships = household.memberships.select_related('user').order_by('-role', 'joined_at')
        serializer = HouseholdMemberSerializer(memberships, many=True)
        return Response(serializer.data)

    def post(self, request, household_id):
        household = self.get_household(request, household_id)

        if not _can_manage_household(request.user, household):
            return Response(
                {'message': 'Vous n avez pas les droits pour gerer ce foyer.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = HouseholdMemberCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member_user = serializer.get_member_user()

        if member_user.id == household.owner_id:
            role = HouseholdMember.ROLE_OWNER
        else:
            role = serializer.validated_data['role']

        membership, created = HouseholdMember.objects.update_or_create(
            household=household,
            user=member_user,
            defaults={
                'role': role,
                'is_active': True,
            },
        )

        membership_serializer = HouseholdMemberSerializer(membership)
        return Response(
            {
                'status': 'created' if created else 'updated',
                'member': membership_serializer.data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class HouseholdMemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_household(self, request, household_id):
        return get_object_or_404(_household_queryset_for_user(request.user), id=household_id)

    def patch(self, request, household_id, member_id):
        household = self.get_household(request, household_id)

        if not _can_manage_household(request.user, household):
            return Response(
                {'message': 'Vous n avez pas les droits pour gerer ce foyer.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        membership = get_object_or_404(household.memberships.select_related('user'), id=member_id)

        if membership.user_id == household.owner_id:
            membership.role = HouseholdMember.ROLE_OWNER
            membership.is_active = True
            membership.save(update_fields=['role', 'is_active'])
            return Response(HouseholdMemberSerializer(membership).data)

        role = request.data.get('role')
        is_active = request.data.get('is_active')

        if role in dict(HouseholdMember.ROLE_CHOICES):
            membership.role = role

        if isinstance(is_active, bool):
            membership.is_active = is_active

        membership.save(update_fields=['role', 'is_active'])
        return Response(HouseholdMemberSerializer(membership).data)

    def delete(self, request, household_id, member_id):
        household = self.get_household(request, household_id)

        if not _can_manage_household(request.user, household):
            return Response(
                {'message': 'Vous n avez pas les droits pour gerer ce foyer.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        membership = get_object_or_404(household.memberships.select_related('user'), id=member_id)

        if membership.user_id == household.owner_id:
            return Response(
                {'message': 'Le proprietaire ne peut pas etre retire du foyer.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== SHARED BUDGET VIEWS ====================

class SharedBudgetListCreateView(generics.ListCreateAPIView):
    serializer_class = SharedBudgetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SharedBudget.objects.filter(
            Q(owner=self.request.user)
            | Q(members=self.request.user)
            | Q(household__owner=self.request.user)
            | Q(household__memberships__user=self.request.user, household__memberships__is_active=True)
        ).distinct()
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class SharedBudgetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SharedBudgetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SharedBudget.objects.filter(
            Q(owner=self.request.user)
            | Q(members=self.request.user)
            | Q(household__owner=self.request.user)
            | Q(household__memberships__user=self.request.user, household__memberships__is_active=True)
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


class ImportSessionUploadView(APIView):
    """Upload a CSV file and create transactions from it.

    Accepts multipart form-data with a ``file`` field and an optional
    ``account`` id. De-duplicates rows and auto-categorizes new transactions.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        upload = request.FILES.get('file')
        if upload is None:
            return Response(
                {'message': 'Aucun fichier fourni (champ "file" attendu).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        account = None
        account_id = request.data.get('account')
        if account_id:
            account = BankAccount.objects.filter(user=request.user, pk=account_id).first()
            if account is None:
                return Response(
                    {'message': "Compte introuvable."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        session = ImportSession.objects.create(
            user=request.user,
            source='csv',
            account=account,
            file_name=getattr(upload, 'name', '')[:255],
            status='processing',
        )

        try:
            result = import_transactions_from_csv(
                request.user,
                account,
                upload.read(),
                file_name=session.file_name,
            )
        except CSVImportError as error:
            session.status = 'failed'
            session.error_message = str(error)
            session.save(update_fields=['status', 'error_message'])
            return Response({'message': str(error)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as error:  # pragma: no cover - defensive
            logger.exception('CSV import failed for user %s', request.user.id)
            session.status = 'failed'
            session.error_message = str(error)
            session.save(update_fields=['status', 'error_message'])
            return Response(
                {'message': "L'import a échoué. Vérifiez le format du fichier."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        session.status = 'completed'
        session.transactions_count = result['created']
        session.duplicates_count = result['duplicates']
        session.save(update_fields=['status', 'transactions_count', 'duplicates_count'])

        return Response(
            {
                'message': (
                    f"{result['created']} transaction(s) importée(s), "
                    f"{result['duplicates']} doublon(s) ignoré(s)."
                ),
                'import_session': ImportSessionSerializer(session).data,
                **result,
            },
            status=status.HTTP_201_CREATED,
        )


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


# ==================== ANALYTICS & DASHBOARD VIEWS ====================

class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        target_cur = user.preferred_currency or 'EUR'
        from zenspendbackend.services.currency import convert_currency
        
        # Calculate total balance across all accounts after conversion
        total_balance = 0.0
        accounts = BankAccount.objects.filter(user=user, is_active=True)
        for acc in accounts:
            converted_bal = convert_currency(acc.balance, acc.currency or 'EUR', target_cur)
            total_balance += converted_bal

        # Current month income and expenses
        today = datetime.now()
        start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        monthly_income = 0.0
        monthly_expenses = 0.0
        
        transactions = Transaction.objects.filter(user=user, date__gte=start_of_month).select_related('account')
        for tx in transactions:
            tx_cur = tx.original_currency
            if not tx_cur and tx.account:
                tx_cur = tx.account.currency
            if not tx_cur:
                tx_cur = 'EUR'
            
            converted_amount = convert_currency(tx.amount, tx_cur, target_cur)
            if converted_amount > 0:
                monthly_income += converted_amount
            else:
                monthly_expenses += converted_amount

        return Response({
            'totalBalance': float(total_balance),
            'monthlyIncome': float(monthly_income),
            'monthlyExpenses': abs(float(monthly_expenses)),
            'currency': target_cur
        })


class AnalyticsMonthlyExpensesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        target_cur = user.preferred_currency or 'EUR'
        from zenspendbackend.services.currency import convert_currency
        
        # Last 6 months
        end_date = datetime.now()
        
        # Simple grouping by month
        data = []
        for i in range(6):
            month_date = end_date - timedelta(days=i*30)
            month_name = month_date.strftime('%b')
            
            month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            next_month = (month_start + timedelta(days=32)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            monthly_txs = Transaction.objects.filter(
                user=user,
                date__gte=month_start,
                date__lt=next_month
            ).select_related('account')
            
            expenses = 0.0
            income = 0.0
            
            for tx in monthly_txs:
                tx_cur = tx.original_currency
                if not tx_cur and tx.account:
                    tx_cur = tx.account.currency
                if not tx_cur:
                    tx_cur = 'EUR'
                
                converted_amount = convert_currency(tx.amount, tx_cur, target_cur)
                if converted_amount > 0:
                    income += converted_amount
                else:
                    expenses += converted_amount
            
            data.append({
                'month': month_name,
                'expenses': float(abs(expenses)),
                'income': float(income)
            })
            
        return Response(data[::-1])


class AnalyticsCategoryDistributionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        target_cur = user.preferred_currency or 'EUR'
        from zenspendbackend.services.currency import convert_currency
        
        # Expenses by category for current month
        today = datetime.now()
        start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        transactions = Transaction.objects.filter(
            user=user,
            date__gte=start_of_month,
            amount__lt=0
        ).select_related('category', 'account')
        
        categories_map = {}
        for tx in transactions:
            cat_name = tx.category.name if tx.category else 'Sans catégorie'
            cat_color = tx.category.color if tx.category else '#CBD5E1'
            
            tx_cur = tx.original_currency
            if not tx_cur and tx.account:
                tx_cur = tx.account.currency
            if not tx_cur:
                tx_cur = 'EUR'
            
            converted_amount = convert_currency(tx.amount, tx_cur, target_cur)
            
            if cat_name not in categories_map:
                categories_map[cat_name] = {
                    'total': 0.0,
                    'color': cat_color
                }
            categories_map[cat_name]['total'] += abs(converted_amount)
            
        labels = []
        data = []
        colors = []
        
        for cat_name, val in categories_map.items():
            labels.append(cat_name)
            data.append(float(val['total']))
            colors.append(val['color'])
            
        return Response({
            'labels': labels,
            'data': data,
            'colors': colors
        })

class ContactRateThrottle(throttling.AnonRateThrottle):
    scope = 'contact'


class ContactView(APIView):
    """Public endpoint receiving contact-form submissions and emailing support."""
    permission_classes = [AllowAny]
    throttle_classes = [ContactRateThrottle]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        sent = send_contact_email(
            name=data['name'],
            sender_email=data['email'],
            subject=data['subject'],
            message=data['message'],
        )
        if not sent:
            return Response(
                {'message': "Le message n'a pas pu être envoyé. Réessayez plus tard."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(
            {'message': 'Message envoyé. Merci, nous reviendrons vers vous rapidement.'},
            status=status.HTTP_200_OK,
        )
