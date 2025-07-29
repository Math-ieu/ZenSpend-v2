from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import logging

from .models import (
    User, BankAccount, Category, Tag, Receipt, RecurringSchedule, Transaction,
    TransactionRule, Budget, SavingsGoal, DebtTracker, SharedBudget, DebtRecord,
    Notification, FinancialSnapshot, ImportSession, Achievement, Challenge,
    FinancialReport, ChatSession, ChatMessage, UserPreference, FinancialInsight
)

from django.contrib.auth import get_user_model
User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'phone_number', 
                 'preferred_currency', 'password', 'password_confirm')
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas.")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        # Créer les préférences par défaut
        UserPreference.objects.create(user=user)
        return user


logger = logging.getLogger(__name__)
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields[self.username_field] = serializers.EmailField()
        self.fields.pop('username', None)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Ajout d'infos personnalisées au token JWT
        token['first_name'] = user.first_name
        token['email'] = user.email
        token['last_name'] = user.last_name
        token['id'] = user.id
        token['preferred_currency'] = user.preferred_currency
        token['phone_number'] = user.phone_number
        return token

    def validate(self, attrs):
        # Récupérer email et password
        email = attrs.get('email')
        password = attrs.get('password')

        # Log pour déboguer
        logger.debug(f"Tentative de connexion: email={email}")

        if email and password:
            from .models import User

            try:
                user = User.objects.get(email=email)
                logger.debug(f"User trouvé: {user.email}")

                if not user.check_password(password):
                    raise serializers.ValidationError(
                        {"detail": "Mot de passe incorrect."}
                    )

            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {"detail": f"Aucun compte trouvé avec l'email: {email}"}
                )
            except Exception as e:
                logger.error(f"Erreur d'authentification: {str(e)}")
                raise serializers.ValidationError(
                    {"detail": f"Erreur de connexion: {str(e)}"}
                )
        else:
            raise serializers.ValidationError(
                {"detail": "Email et mot de passe sont requis."}
            )

        # Obtenir le token JWT
        refresh = self.get_token(user)

        # Construire la réponse
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'email': user.email,
                'fist_name': user.first_name,
                'last_name': user.last_name,
                'phone_number': user.phone_number,
                'preferred_currency': user.preferred_currency,
                'id': user.id,
                
            }
        }

        return data 

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'profile_pic',
                  'phone_number', 'is_active', 'created_at', 'preferred_currency',
                  'notification_preferences']
        read_only_fields = ['id', 'created_at', 'is_active']

class BankAccountSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = BankAccount
        fields = ['id', 'name', 'account_number', 'balance', 'currency', 'account_type',
                  'user', 'institution', 'is_active', 'last_sync', 'connection_details']
        read_only_fields = ['id', 'balance', 'last_sync']

class CategorySerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True)
    parent_category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), allow_null=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'color', 'user', 'is_expense',
                  'is_tax_deductible', 'parent_category', 'is_system']
        read_only_fields = ['id', 'is_system']

class TagSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Tag
        fields = ['id', 'name', 'user', 'color']
        read_only_fields = ['id']

class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = ['id', 'transaction', 'image_url', 'ocr_text', 'processed_data', 'date_added']
        read_only_fields = ['id', 'date_added']

class RecurringScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecurringSchedule
        fields = ['id', 'transaction', 'budget', 'frequency', 'day_of_month',
                  'day_of_week', 'start_date', 'end_date', 'next_occurrence']
        read_only_fields = ['id', 'next_occurrence']

class TransactionSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), allow_null=True)
    account = serializers.PrimaryKeyRelatedField(queryset=BankAccount.objects.all(), allow_null=True)
    tags = serializers.PrimaryKeyRelatedField(many=True, queryset=Tag.objects.all())
    receipt = ReceiptSerializer(required=False, allow_null=True)
    recurring_schedule = RecurringScheduleSerializer(required=False, allow_null=True)

    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'original_amount', 'original_currency', 'description',
                  'date', 'category', 'tags', 'user', 'account', 'is_recurring',
                  'recurring_schedule', 'receipt', 'location', 'payee', 'status',
                  'notes', 'is_split', 'parent_transaction']
        read_only_fields = ['id', 'date']

    def create(self, validated_data):
        receipt_data = validated_data.pop('receipt', None)
        schedule_data = validated_data.pop('recurring_schedule', None)
        tags = validated_data.pop('tags', [])
        transaction = Transaction.objects.create(**validated_data)
        if receipt_data:
            Receipt.objects.create(transaction=transaction, **receipt_data)
        if schedule_data:
            RecurringSchedule.objects.create(transaction=transaction, **schedule_data)
        transaction.tags.set(tags)
        return transaction

    def update(self, instance, validated_data):
        receipt_data = validated_data.pop('receipt', None)
        schedule_data = validated_data.pop('recurring_schedule', None)
        tags = validated_data.pop('tags', None)
        instance = super().update(instance, validated_data)
        if receipt_data:
            if hasattr(instance, 'receipt'):
                for attr, value in receipt_data.items():
                    setattr(instance.receipt, attr, value)
                instance.receipt.save()
            else:
                Receipt.objects.create(transaction=instance, **receipt_data)
        if schedule_data:
            if hasattr(instance, 'recurring_schedule'):
                for attr, value in schedule_data.items():
                    setattr(instance.recurring_schedule, attr, value)
                instance.recurring_schedule.save()
            else:
                RecurringSchedule.objects.create(transaction=instance, **schedule_data)
        if tags is not None:
            instance.tags.set(tags)
        return instance

class TransactionRuleSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    assign_category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), allow_null=True)
    assign_tags = serializers.PrimaryKeyRelatedField(many=True, queryset=Tag.objects.all())

    class Meta:
        model = TransactionRule
        fields = ['id', 'name', 'user', 'keywords', 'amount_min', 'amount_max',
                  'payee', 'assign_category', 'assign_tags', 'is_active']
        read_only_fields = ['id']

class BudgetSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    categories = serializers.PrimaryKeyRelatedField(many=True, queryset=Category.objects.all())
    accounts = serializers.PrimaryKeyRelatedField(many=True, queryset=BankAccount.objects.all())
    recurring_schedule = RecurringScheduleSerializer(required=False, allow_null=True)

    class Meta:
        model = Budget
        fields = ['id', 'name', 'amount', 'start_date', 'end_date', 'user',
                  'categories', 'accounts', 'is_recurring', 'recurring_schedule',
                  'current_amount', 'alert_threshold', 'percentage_used']
        read_only_fields = ['id', 'current_amount', 'percentage_used']

    def create(self, validated_data):
        schedule_data = validated_data.pop('recurring_schedule', None)
        categories = validated_data.pop('categories', [])
        accounts = validated_data.pop('accounts', [])
        budget = Budget.objects.create(**validated_data)
        budget.categories.set(categories)
        budget.accounts.set(accounts)
        if schedule_data:
            RecurringSchedule.objects.create(budget=budget, **schedule_data)
        return budget

    def update(self, instance, validated_data):
        schedule_data = validated_data.pop('recurring_schedule', None)
        categories = validated_data.pop('categories', None)
        accounts = validated_data.pop('accounts', None)
        instance = super().update(instance, validated_data)
        if categories is not None:
            instance.categories.set(categories)
        if accounts is not None:
            instance.accounts.set(accounts)
        if schedule_data:
            if hasattr(instance, 'recurring_schedule'):
                for attr, value in schedule_data.items():
                    setattr(instance.recurring_schedule, attr, value)
                instance.recurring_schedule.save()
            else:
                RecurringSchedule.objects.create(budget=instance, **schedule_data)
        return instance

class SavingsGoalSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    account = serializers.PrimaryKeyRelatedField(queryset=BankAccount.objects.all(), allow_null=True)

    class Meta:
        model = SavingsGoal
        fields = ['id', 'name', 'target_amount', 'current_amount', 'deadline',
                  'user', 'icon', 'account', 'auto_save', 'auto_save_amount',
                  'auto_save_frequency', 'notes', 'percentage_complete']
        read_only_fields = ['id', 'current_amount', 'percentage_complete']

class DebtTrackerSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    account = serializers.PrimaryKeyRelatedField(queryset=BankAccount.objects.all(), allow_null=True)

    class Meta:
        model = DebtTracker
        fields = ['id', 'name', 'total_amount', 'remaining_amount', 'interest_rate',
                  'minimum_payment', 'payment_due_date', 'lender', 'user', 'account']
        read_only_fields = ['id']

class SharedBudgetSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    members = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all())
    categories = serializers.PrimaryKeyRelatedField(many=True, queryset=Category.objects.all())

    class Meta:
        model = SharedBudget
        fields = ['id', 'name', 'owner', 'members', 'amount', 'start_date',
                  'end_date', 'categories', 'current_amount']
        read_only_fields = ['id', 'current_amount']

class DebtRecordSerializer(serializers.ModelSerializer):
    creditor = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    debtor = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    related_transaction = serializers.PrimaryKeyRelatedField(queryset=Transaction.objects.all(), allow_null=True)

    class Meta:
        model = DebtRecord
        fields = ['id', 'creditor', 'debtor', 'amount', 'description', 'date_created',
                  'due_date', 'is_settled', 'settled_date', 'related_transaction']
        read_only_fields = ['id', 'date_created', 'settled_date']

class NotificationSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'created_at', 'is_read',
                  'type', 'priority', 'related_object_id', 'action_url']
        read_only_fields = ['id', 'created_at']

class FinancialSnapshotSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = FinancialSnapshot
        fields = ['id', 'user', 'date', 'total_assets', 'total_liabilities',
                  'net_worth', 'total_income_mtd', 'total_expenses_mtd',
                  'accounts_snapshot']
        read_only_fields = ['id', 'date']

class ImportSessionSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    account = serializers.PrimaryKeyRelatedField(queryset=BankAccount.objects.all(), allow_null=True)

    class Meta:
        model = ImportSession
        fields = ['id', 'user', 'source', 'date_imported', 'account', 'file_name',
                  'status', 'error_message', 'transactions_count', 'duplicates_count']
        read_only_fields = ['id', 'date_imported', 'transactions_count', 'duplicates_count']

class AchievementSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Achievement
        fields = ['id', 'user', 'name', 'description', 'icon', 'date_earned',
                  'achievement_type', 'level']
        read_only_fields = ['id', 'date_earned']

class ChallengeSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), allow_null=True)

    class Meta:
        model = Challenge
        fields = ['id', 'name', 'description', 'start_date', 'end_date',
                  'target_value', 'current_value', 'challenge_type', 'category',
                  'user', 'is_completed']
        read_only_fields = ['id', 'current_value']

class FinancialReportSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = FinancialReport
        fields = ['id', 'user', 'title', 'report_type', 'date_range_start',
                  'date_range_end', 'generation_date', 'data', 'is_scheduled',
                  'schedule_frequency']
        read_only_fields = ['id', 'generation_date']

class ChatSessionSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = ChatSession
        fields = ['id', 'user', 'started_at', 'last_activity', 'is_active', 'context']
        read_only_fields = ['id', 'started_at', 'last_activity']

class ChatMessageSerializer(serializers.ModelSerializer):
    session = serializers.PrimaryKeyRelatedField(queryset=ChatSession.objects.all())

    class Meta:
        model = ChatMessage
        fields = ['id', 'session', 'content', 'timestamp', 'is_bot', 'message_type',
                  'action_data']
        read_only_fields = ['id', 'timestamp']

class UserPreferenceSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = UserPreference
        fields = ['id', 'user', 'theme', 'language', 'dashboard_widgets',
                  'start_page', 'export_format']
        read_only_fields = ['id']

class FinancialInsightSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = FinancialInsight
        fields = ['id', 'user', 'title', 'description', 'created_at', 'insight_type',
                  'priority', 'viewed', 'related_data']
        read_only_fields = ['id', 'created_at']  