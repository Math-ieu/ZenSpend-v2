from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import logging

from .models import *

from django.contrib.auth import get_user_model
User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'phone_number', 
                 'preferred_currency', 'user_segment', 'password', 'password_confirm')
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
        token['user_segment'] = user.user_segment
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

        # Compte désactivé (ex: suppression demandée) → connexion refusée.
        if not user.is_active:
            raise serializers.ValidationError(
                {"detail": "Ce compte a été désactivé."}
            )

        # Obtenir le token JWT
        refresh = self.get_token(user)

        # Construire la réponse
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone_number': user.phone_number,
                'preferred_currency': user.preferred_currency,
                'user_segment': user.user_segment,
                'id': user.id,
                
            }
        }

        return data 

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'profile_pic',
                  'phone_number', 'is_active', 'created_at', 'preferred_currency',
                  'user_segment', 'notification_preferences']
        read_only_fields = ['id', 'created_at', 'is_active']


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    user_segment = serializers.ChoiceField(
        choices=[choice[0] for choice in User.USER_SEGMENT_CHOICES],
        required=False,
    )


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError('Les mots de passe ne correspondent pas.')
        return attrs


class HouseholdMemberSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = HouseholdMember
        fields = ['id', 'user', 'user_email', 'user_full_name', 'role', 'is_active', 'joined_at']
        read_only_fields = ['id', 'joined_at', 'user_email', 'user_full_name']


class HouseholdSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    members_count = serializers.SerializerMethodField()

    class Meta:
        model = Household
        fields = [
            'id',
            'name',
            'description',
            'owner',
            'owner_email',
            'currency',
            'members_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'owner_email', 'members_count', 'created_at', 'updated_at']

    def get_members_count(self, obj):
        return obj.memberships.filter(is_active=True).count()


class HouseholdMemberCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=HouseholdMember.ROLE_CHOICES, default=HouseholdMember.ROLE_CHILD)

    def validate_email(self, value):
        user = User.objects.filter(email=value).first()
        if user is None:
            raise serializers.ValidationError("Aucun utilisateur trouvé avec cet email.")
        self.context['member_user'] = user
        return value

    def get_member_user(self):
        return self.context['member_user']

class BankAccountSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = BankAccount
        fields = ['id', 'name', 'account_number', 'balance', 'currency', 'account_type',
                  'user', 'institution', 'is_active', 'last_sync', 'connection_details']
        read_only_fields = ['id', 'balance', 'last_sync']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            target_cur = request.user.preferred_currency or 'EUR'
            from_cur = instance.currency or 'EUR'
            if 'balance' in ret and ret['balance'] is not None:
                from zenspendbackend.services.currency import convert_currency
                ret['balance'] = convert_currency(float(ret['balance']), from_cur, target_cur)
            ret['currency'] = target_cur
        return ret

class CategorySerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True)
    parent_category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), allow_null=True)

    class Meta:
        model = Category
        fields = ['id', 'name',  'color', 'user', 'is_expense',
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
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), allow_null=True, required=False)
    account = serializers.PrimaryKeyRelatedField(queryset=BankAccount.objects.all(), allow_null=True, required=False)
    tags = serializers.PrimaryKeyRelatedField(many=True, queryset=Tag.objects.all(), required=False)
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

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            target_cur = request.user.preferred_currency or 'EUR'
            from_cur = instance.original_currency
            if not from_cur and instance.account:
                from_cur = instance.account.currency
            if not from_cur:
                from_cur = 'EUR'
            if 'amount' in ret and ret['amount'] is not None:
                from zenspendbackend.services.currency import convert_currency
                ret['amount'] = convert_currency(float(ret['amount']), from_cur, target_cur)
        return ret

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

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            target_cur = request.user.preferred_currency or 'EUR'
            from zenspendbackend.services.currency import convert_currency
            if 'amount' in ret and ret['amount'] is not None:
                ret['amount'] = convert_currency(float(ret['amount']), 'EUR', target_cur)
            if 'current_amount' in ret and ret['current_amount'] is not None:
                ret['current_amount'] = convert_currency(float(ret['current_amount']), 'EUR', target_cur)
        return ret

class SavingsGoalSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    account = serializers.PrimaryKeyRelatedField(queryset=BankAccount.objects.all(), allow_null=True)

    class Meta:
        model = SavingsGoal
        fields = ['id', 'name', 'target_amount', 'current_amount', 'deadline',
                  'user', 'account', 'auto_save', 'auto_save_amount',
                  'auto_save_frequency', 'notes', 'percentage_complete']
        read_only_fields = ['id', 'current_amount', 'percentage_complete']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            target_cur = request.user.preferred_currency or 'EUR'
            from zenspendbackend.services.currency import convert_currency
            for field in ['target_amount', 'current_amount', 'auto_save_amount']:
                if field in ret and ret[field] is not None:
                    ret[field] = convert_currency(float(ret[field]), 'EUR', target_cur)
        return ret

class DebtTrackerSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    account = serializers.PrimaryKeyRelatedField(queryset=BankAccount.objects.all(), allow_null=True)

    class Meta:
        model = DebtTracker
        fields = ['id', 'name', 'total_amount', 'remaining_amount', 'interest_rate',
                  'minimum_payment', 'payment_due_date', 'lender', 'user', 'account']
        read_only_fields = ['id']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            target_cur = request.user.preferred_currency or 'EUR'
            from zenspendbackend.services.currency import convert_currency
            for field in ['total_amount', 'remaining_amount', 'minimum_payment']:
                if field in ret and ret[field] is not None:
                    ret[field] = convert_currency(float(ret[field]), 'EUR', target_cur)
        return ret

class SharedBudgetSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    household = serializers.PrimaryKeyRelatedField(queryset=Household.objects.all())
    household_name = serializers.CharField(source='household.name', read_only=True)
    members = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), required=False)
    categories = serializers.PrimaryKeyRelatedField(many=True, queryset=Category.objects.all())

    class Meta:
        model = SharedBudget
        fields = ['id', 'name', 'owner', 'household', 'household_name', 'members', 'amount', 'start_date',
                  'end_date', 'categories', 'current_amount']
        read_only_fields = ['id', 'current_amount']

    def validate(self, attrs):
        request = self.context.get('request')
        acting_user = request.user if request else None

        household = attrs.get('household') or getattr(self.instance, 'household', None)
        if household is None:
            raise serializers.ValidationError({
                'household': 'Un budget partage doit etre rattache a un foyer.'
            })

        if acting_user is not None:
            can_access_household = (
                household.owner_id == acting_user.id
                or HouseholdMember.objects.filter(
                    household=household,
                    user=acting_user,
                    is_active=True,
                ).exists()
            )

            if not can_access_household:
                raise serializers.ValidationError({
                    'household': 'Vous ne pouvez pas utiliser ce foyer.'
                })

            can_manage_household = (
                household.owner_id == acting_user.id
                or HouseholdMember.objects.filter(
                    household=household,
                    user=acting_user,
                    is_active=True,
                    role__in=[
                        HouseholdMember.ROLE_OWNER,
                        HouseholdMember.ROLE_PARENT,
                        HouseholdMember.ROLE_PARTNER,
                    ],
                ).exists()
            )

            if not can_manage_household:
                raise serializers.ValidationError({
                    'household': 'Vous devez etre manager du foyer pour creer ou modifier un budget partage.'
                })

        household_member_ids = set(
            HouseholdMember.objects.filter(household=household, is_active=True).values_list('user_id', flat=True)
        )
        household_member_ids.add(household.owner_id)

        members = attrs.get('members')
        if members is None and self.instance is not None:
            members = list(self.instance.members.all())
        if members is None:
            members = []

        invalid_member_ids = [member.id for member in members if member.id not in household_member_ids]
        if invalid_member_ids:
            raise serializers.ValidationError({
                'members': f'Tous les membres doivent appartenir au foyer actif. IDs invalides: {invalid_member_ids}'
            })

        owner = attrs.get('owner') or getattr(self.instance, 'owner', acting_user)
        if owner and owner.id not in household_member_ids:
            raise serializers.ValidationError({
                'owner': 'Le proprietaire du budget doit appartenir au foyer.'
            })

        return attrs

    def create(self, validated_data):
        members = validated_data.pop('members', [])
        categories = validated_data.pop('categories', [])

        budget = SharedBudget.objects.create(**validated_data)
        budget.categories.set(categories)
        budget.members.set(members)

        if budget.owner_id and not budget.members.filter(id=budget.owner_id).exists():
            budget.members.add(budget.owner)

        return budget

    def update(self, instance, validated_data):
        members = validated_data.pop('members', None)
        categories = validated_data.pop('categories', None)

        instance = super().update(instance, validated_data)

        if members is not None:
            instance.members.set(members)
        if categories is not None:
            instance.categories.set(categories)

        if instance.owner_id and not instance.members.filter(id=instance.owner_id).exists():
            instance.members.add(instance.owner)

        return instance

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            target_cur = request.user.preferred_currency or 'EUR'
            from_cur = instance.household.currency if (instance.household and instance.household.currency) else 'EUR'
            from zenspendbackend.services.currency import convert_currency
            if 'amount' in ret and ret['amount'] is not None:
                ret['amount'] = convert_currency(float(ret['amount']), from_cur, target_cur)
            if 'current_amount' in ret and ret['current_amount'] is not None:
                ret['current_amount'] = convert_currency(float(ret['current_amount']), from_cur, target_cur)
        return ret

class DebtRecordSerializer(serializers.ModelSerializer):
    creditor = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    debtor = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    related_transaction = serializers.PrimaryKeyRelatedField(queryset=Transaction.objects.all(), allow_null=True)

    class Meta:
        model = DebtRecord
        fields = ['id', 'creditor', 'debtor', 'amount', 'description', 'date_created',
                  'due_date', 'is_settled', 'settled_date', 'related_transaction']
        read_only_fields = ['id', 'date_created', 'settled_date']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            target_cur = request.user.preferred_currency or 'EUR'
            from zenspendbackend.services.currency import convert_currency
            if 'amount' in ret and ret['amount'] is not None:
                ret['amount'] = convert_currency(float(ret['amount']), 'EUR', target_cur)
        return ret

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
        fields = ['id', 'user', 'name', 'description', 'date_earned',
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
                  'start_page', 'export_format', 'onboarding_completed']
        read_only_fields = ['id']

class FinancialInsightSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = FinancialInsight
        fields = ['id', 'user', 'title', 'description', 'created_at', 'insight_type',
                  'priority', 'viewed', 'related_data']
        read_only_fields = ['id', 'created_at']   



class SubscriptionSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Subscription
        fields = ['id', 'user', 'plan_id', 'current_period_start', 'current_period_end', 'status',
                  'cancel_at_period_end', 'stripe_subscription_id', 'currency', 'payment_method',
                  'is_auto_renew', 'next_billing_date', 'amount']
        
        read_only_fields = ['id', 'current_period_start', 'current_period_end', 'next_billing_date']
        

class ContactMessageSerializer(serializers.Serializer):
    """Validates a public contact-form submission (no model backing)."""
    name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    subject = serializers.CharField(max_length=200)
    message = serializers.CharField(max_length=5000)
