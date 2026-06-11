from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
	BankAccount,
	BankConnection,
	Category,
	ExternalTransaction,
	Household,
	HouseholdMember,
	SharedBudget,
	Transaction,
)


User = get_user_model()


class BankIntegrationApiTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			email='integration-test@zenspend.local',
			password='StrongPass123!',
			first_name='Integration',
			last_name='Tester',
		)
		self.client.force_authenticate(user=self.user)

	@patch.dict('os.environ', {'BANK_PROVIDER': 'mock'}, clear=False)
	def test_status_endpoint_returns_mock_provider(self):
		response = self.client.get(reverse('bank-integration-status'))

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['integration']['provider'], 'mock')
		self.assertTrue(response.data['integration']['configured'])

	@patch.dict('os.environ', {'BANK_PROVIDER': 'mock'}, clear=False)
	def test_link_session_endpoint_returns_link_session(self):
		response = self.client.post(
			reverse('bank-link-session-create'),
			{'redirect_uri': 'https://app.zenspend.test/callback'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data['status'], 'success')
		self.assertEqual(response.data['link_session']['provider'], 'mock')
		self.assertIn('session_id', response.data['link_session'])
		self.assertIn('link_url', response.data['link_session'])

	@patch.dict(
		'os.environ',
		{
			'BANK_PROVIDER': 'powens',
			'BANK_PROVIDER_BASE_URL': '',
			'BANK_PROVIDER_CLIENT_ID': '',
			'BANK_PROVIDER_CLIENT_SECRET': '',
		},
		clear=False,
	)
	def test_link_session_returns_503_when_provider_not_configured(self):
		response = self.client.post(reverse('bank-link-session-create'), {}, format='json')

		self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
		self.assertEqual(response.data['status'], 'error')

	@patch.dict('os.environ', {'BANK_PROVIDER': 'mock'}, clear=False)
	def test_callback_creates_bank_connection_and_account(self):
		response = self.client.post(
			reverse('bank-callback'),
			{
				'external_connection_id': 'conn_test_123',
				'institution_name': 'Mock Bank',
				'accounts': [
					{
						'external_account_id': 'acc_test_1',
						'name': 'Compte Courant',
						'account_type': 'checking',
						'currency': 'EUR',
						'balance': '1250.50',
					}
				],
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['status'], 'success')
		self.assertEqual(response.data['accounts_connected'], 1)

		connection = BankConnection.objects.get(user=self.user, external_connection_id='conn_test_123')
		self.assertEqual(connection.provider, 'mock')
		self.assertEqual(connection.status, 'connected')

		account = BankAccount.objects.get(user=self.user, name='Compte Courant')
		self.assertEqual(account.connection_details['external_account_id'], 'acc_test_1')

	@patch.dict('os.environ', {'BANK_PROVIDER': 'mock'}, clear=False)
	def test_sync_endpoint_is_idempotent_for_same_external_transaction(self):
		callback_response = self.client.post(
			reverse('bank-callback'),
			{
				'external_connection_id': 'conn_sync_123',
				'institution_name': 'Mock Bank',
				'accounts': [
					{
						'external_account_id': 'acc_sync_1',
						'name': 'Main Account',
						'account_type': 'checking',
						'currency': 'EUR',
						'balance': '2000.00',
					}
				],
			},
			format='json',
		)
		self.assertEqual(callback_response.status_code, status.HTTP_200_OK)

		connection_id = callback_response.data['bank_connection']['id']

		sync_payload = {
			'connection_id': connection_id,
			'transactions': [
				{
					'id': 'ext_tx_1',
					'account_external_id': 'acc_sync_1',
					'amount': '-19.99',
					'description': 'Coffee Shop',
					'date': '2026-04-14T08:30:00Z',
					'payee': 'Cafe',
					'status': 'cleared',
				}
			],
		}

		first_sync_response = self.client.post(reverse('bank-sync-transactions'), sync_payload, format='json')
		self.assertEqual(first_sync_response.status_code, status.HTTP_200_OK)
		self.assertEqual(first_sync_response.data['sync_result']['created'], 1)
		self.assertEqual(first_sync_response.data['sync_result']['duplicates'], 0)

		second_sync_response = self.client.post(reverse('bank-sync-transactions'), sync_payload, format='json')
		self.assertEqual(second_sync_response.status_code, status.HTTP_200_OK)
		self.assertEqual(second_sync_response.data['sync_result']['created'], 0)
		self.assertEqual(second_sync_response.data['sync_result']['duplicates'], 1)

		self.assertEqual(Transaction.objects.filter(user=self.user).count(), 1)
		self.assertEqual(ExternalTransaction.objects.count(), 1)

	@patch.dict('os.environ', {'BANK_PROVIDER': 'mock'}, clear=False)
	def test_sync_from_provider_endpoint_imports_and_is_idempotent(self):
		callback_response = self.client.post(
			reverse('bank-callback'),
			{
				'external_connection_id': 'conn_provider_123',
				'provider': 'mock',
				'institution_name': 'Mock Bank',
				'accounts': [
					{
						'external_account_id': 'conn_provider_123_main',
						'name': 'Main Account',
						'account_type': 'checking',
						'currency': 'EUR',
						'balance': '2000.00',
					}
				],
			},
			format='json',
		)
		self.assertEqual(callback_response.status_code, status.HTTP_200_OK)

		connection_id = callback_response.data['bank_connection']['id']

		first_sync_response = self.client.post(
			reverse('bank-sync-from-provider'),
			{'connection_id': connection_id},
			format='json',
		)
		self.assertEqual(first_sync_response.status_code, status.HTTP_200_OK)
		self.assertEqual(first_sync_response.data['status'], 'success')
		self.assertEqual(first_sync_response.data['fetched_transactions'], 3)
		self.assertEqual(first_sync_response.data['sync_result']['created'], 3)
		self.assertEqual(first_sync_response.data['sync_result']['duplicates'], 0)

		second_sync_response = self.client.post(
			reverse('bank-sync-from-provider'),
			{'connection_id': connection_id},
			format='json',
		)
		self.assertEqual(second_sync_response.status_code, status.HTTP_200_OK)
		self.assertEqual(second_sync_response.data['sync_result']['created'], 0)
		self.assertEqual(second_sync_response.data['sync_result']['duplicates'], 3)

		self.assertEqual(Transaction.objects.filter(user=self.user).count(), 3)
		self.assertEqual(ExternalTransaction.objects.count(), 3)


class UserSegmentApiTests(APITestCase):
	def test_register_login_and_profile_update_persist_user_segment(self):
		register_response = self.client.post(
			reverse('register'),
			{
				'email': 'segment-user@zenspend.local',
				'first_name': 'Segment',
				'last_name': 'User',
				'phone_number': '+33102030405',
				'preferred_currency': 'EUR',
				'user_segment': 'families',
				'password': 'StrongPass123!',
				'password_confirm': 'StrongPass123!',
			},
			format='json',
		)

		self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(register_response.data['data']['user']['user_segment'], 'families')

		login_response = self.client.post(
			reverse('token_obtain_pair'),
			{
				'email': 'segment-user@zenspend.local',
				'password': 'StrongPass123!',
			},
			format='json',
		)

		self.assertEqual(login_response.status_code, status.HTTP_200_OK)
		self.assertEqual(login_response.data['user']['user_segment'], 'families')

		access_token = login_response.data['access']
		self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

		profile_update_response = self.client.patch(
			reverse('user-detail'),
			{'user_segment': 'couples'},
			format='json',
		)

		self.assertEqual(profile_update_response.status_code, status.HTTP_200_OK)
		self.assertEqual(profile_update_response.data['user_segment'], 'couples')

		user = User.objects.get(email='segment-user@zenspend.local')
		self.assertEqual(user.user_segment, 'couples')


class HouseholdApiTests(APITestCase):
	def setUp(self):
		self.owner = User.objects.create_user(
			email='owner@zenspend.local',
			password='StrongPass123!',
			first_name='Owner',
			last_name='Family',
		)
		self.partner = User.objects.create_user(
			email='partner@zenspend.local',
			password='StrongPass123!',
			first_name='Partner',
			last_name='Family',
		)
		self.guest = User.objects.create_user(
			email='guest@zenspend.local',
			password='StrongPass123!',
			first_name='Guest',
			last_name='User',
		)

		self.client.force_authenticate(user=self.owner)

	def test_create_household_auto_creates_owner_membership(self):
		response = self.client.post(
			reverse('household-list-create'),
			{
				'name': 'Foyer Martin',
				'description': 'Gestion budget familial',
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)

		household = Household.objects.get(owner=self.owner, name='Foyer Martin')
		membership = HouseholdMember.objects.get(household=household, user=self.owner)
		self.assertEqual(membership.role, HouseholdMember.ROLE_OWNER)
		self.assertTrue(membership.is_active)

	def test_manage_members_lifecycle(self):
		create_household_response = self.client.post(
			reverse('household-list-create'),
			{'name': 'Foyer Martin', 'description': 'Gestion budget familial'},
			format='json',
		)
		self.assertEqual(create_household_response.status_code, status.HTTP_201_CREATED)
		household_id = create_household_response.data['id']

		add_member_response = self.client.post(
			reverse('household-member-list-create', kwargs={'household_id': household_id}),
			{'email': self.partner.email, 'role': HouseholdMember.ROLE_PARTNER},
			format='json',
		)
		self.assertEqual(add_member_response.status_code, status.HTTP_201_CREATED)
		member_id = add_member_response.data['member']['id']

		update_member_response = self.client.patch(
			reverse('household-member-detail', kwargs={'household_id': household_id, 'member_id': member_id}),
			{'role': HouseholdMember.ROLE_PARENT},
			format='json',
		)
		self.assertEqual(update_member_response.status_code, status.HTTP_200_OK)
		self.assertEqual(update_member_response.data['role'], HouseholdMember.ROLE_PARENT)

		delete_member_response = self.client.delete(
			reverse('household-member-detail', kwargs={'household_id': household_id, 'member_id': member_id}),
		)
		self.assertEqual(delete_member_response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertFalse(HouseholdMember.objects.filter(id=member_id).exists())

	def test_non_manager_cannot_add_members(self):
		household = Household.objects.create(name='Foyer Martin', owner=self.owner, currency='EUR')
		HouseholdMember.objects.create(
			household=household,
			user=self.owner,
			role=HouseholdMember.ROLE_OWNER,
			is_active=True,
		)
		HouseholdMember.objects.create(
			household=household,
			user=self.guest,
			role=HouseholdMember.ROLE_CHILD,
			is_active=True,
		)

		self.client.force_authenticate(user=self.guest)

		response = self.client.post(
			reverse('household-member-list-create', kwargs={'household_id': household.id}),
			{'email': self.partner.email, 'role': HouseholdMember.ROLE_PARTNER},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class SharedBudgetHouseholdApiTests(APITestCase):
	def setUp(self):
		self.owner = User.objects.create_user(
			email='shared-owner@zenspend.local',
			password='StrongPass123!',
			first_name='Shared',
			last_name='Owner',
		)
		self.partner = User.objects.create_user(
			email='shared-partner@zenspend.local',
			password='StrongPass123!',
			first_name='Shared',
			last_name='Partner',
		)
		self.child = User.objects.create_user(
			email='shared-child@zenspend.local',
			password='StrongPass123!',
			first_name='Shared',
			last_name='Child',
		)
		self.outsider = User.objects.create_user(
			email='shared-outsider@zenspend.local',
			password='StrongPass123!',
			first_name='Shared',
			last_name='Outsider',
		)

		self.household = Household.objects.create(name='Foyer Shared', owner=self.owner, currency='EUR')
		HouseholdMember.objects.create(
			household=self.household,
			user=self.owner,
			role=HouseholdMember.ROLE_OWNER,
			is_active=True,
		)
		HouseholdMember.objects.create(
			household=self.household,
			user=self.partner,
			role=HouseholdMember.ROLE_PARTNER,
			is_active=True,
		)
		HouseholdMember.objects.create(
			household=self.household,
			user=self.child,
			role=HouseholdMember.ROLE_CHILD,
			is_active=True,
		)

		self.category = Category.objects.create(
			name='Charges communes',
			user=self.owner,
			is_expense=True,
		)

	def test_manager_can_create_household_scoped_shared_budget(self):
		self.client.force_authenticate(user=self.owner)

		response = self.client.post(
			reverse('shared-budget-list-create'),
			{
				'name': 'Budget Foyer',
				'household': self.household.id,
				'members': [self.partner.id],
				'amount': '1200.00',
				'categories': [self.category.id],
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		budget = SharedBudget.objects.get(id=response.data['id'])
		self.assertEqual(budget.household_id, self.household.id)
		self.assertTrue(budget.members.filter(id=self.owner.id).exists())
		self.assertTrue(budget.members.filter(id=self.partner.id).exists())

	def test_create_shared_budget_rejects_member_outside_household(self):
		self.client.force_authenticate(user=self.owner)

		response = self.client.post(
			reverse('shared-budget-list-create'),
			{
				'name': 'Budget invalide',
				'household': self.household.id,
				'members': [self.partner.id, self.outsider.id],
				'amount': '900.00',
				'categories': [self.category.id],
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('members', response.data)

	def test_child_cannot_create_shared_budget(self):
		self.client.force_authenticate(user=self.child)

		response = self.client.post(
			reverse('shared-budget-list-create'),
			{
				'name': 'Budget enfant',
				'household': self.household.id,
				'members': [self.child.id],
				'amount': '200.00',
				'categories': [self.category.id],
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('household', response.data)


@override_settings(
	PASSWORD_RESET_EXPOSE_LINK=True,
	FRONTEND_RESET_PASSWORD_URL='http://localhost:5173/reset-password',
	EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
	PASSWORD_RESET_EMAIL_PROVIDER='django',
)
class PasswordResetApiTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(
			email='password-reset@zenspend.local',
			password='OldPassword123!',
			first_name='Reset',
			last_name='User',
		)

	def test_request_returns_reset_link_and_sends_email(self):
		response = self.client.post(
			reverse('password-reset-request'),
			{'email': self.user.email},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['status'], 'success')
		self.assertIn('reset_url', response.data)
		self.assertIn('/reset-password/young-professionals?', response.data['reset_url'])
		self.assertEqual(len(mail.outbox), 1)
		self.assertEqual(mail.outbox[0].to, [self.user.email])
		self.assertIn(response.data['reset_url'], mail.outbox[0].body)

	def test_request_uses_explicit_segment_when_provided(self):
		response = self.client.post(
			reverse('password-reset-request'),
			{
			'email': self.user.email,
			'user_segment': 'families',
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('reset_url', response.data)
		self.assertIn('/reset-password/families?', response.data['reset_url'])

	@override_settings(
		PASSWORD_RESET_EMAIL_PROVIDER='resend',
		PASSWORD_RESET_EMAIL_ALLOW_FALLBACK=False,
		RESEND_API_KEY='re_test_key',
	)
	@patch('zenspendbackend.services.email_delivery._send_with_resend')
	def test_request_uses_resend_provider_when_enabled(self, resend_send_mock):
		response = self.client.post(
			reverse('password-reset-request'),
			{'email': self.user.email},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		resend_send_mock.assert_called_once()
		self.assertEqual(len(mail.outbox), 0)

	def test_request_for_unknown_email_remains_generic(self):
		response = self.client.post(
			reverse('password-reset-request'),
			{'email': 'unknown@zenspend.local'},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['status'], 'success')
		self.assertNotIn('reset_url', response.data)
		self.assertEqual(len(mail.outbox), 0)

	def test_confirm_changes_password_and_rejects_token_reuse(self):
		request_response = self.client.post(
			reverse('password-reset-request'),
			{'email': self.user.email},
			format='json',
		)
		self.assertEqual(request_response.status_code, status.HTTP_200_OK)

		reset_url = request_response.data['reset_url']
		token = parse_qs(urlparse(reset_url).query).get('token', [''])[0]
		self.assertTrue(token)

		confirm_response = self.client.post(
			reverse('password-reset-confirm'),
			{
				'token': token,
				'new_password': 'NewPassword123!',
				'confirm_password': 'NewPassword123!',
			},
			format='json',
		)
		self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)

		login_response = self.client.post(
			reverse('token_obtain_pair'),
			{
				'email': self.user.email,
				'password': 'NewPassword123!',
			},
			format='json',
		)
		self.assertEqual(login_response.status_code, status.HTTP_200_OK)

		reuse_response = self.client.post(
			reverse('password-reset-confirm'),
			{
				'token': token,
				'new_password': 'AnotherPassword123!',
				'confirm_password': 'AnotherPassword123!',
			},
			format='json',
		)
		self.assertEqual(reuse_response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertEqual(reuse_response.data['status'], 'error')


from django.core.files.uploadedfile import SimpleUploadedFile

from .models import Budget, SavingsGoal, Notification, TransactionRule


class TransactionIsolationApiTests(APITestCase):
	"""Security: a user must never access another user's data."""

	def setUp(self):
		self.alice = User.objects.create_user(email='alice@zenspend.local', password='StrongPass123!')
		self.bob = User.objects.create_user(email='bob@zenspend.local', password='StrongPass123!')
		self.bob_tx = Transaction.objects.create(user=self.bob, amount='10.00', description='Bob secret')

	def test_user_cannot_list_other_users_transactions(self):
		self.client.force_authenticate(user=self.alice)
		response = self.client.get(reverse('transaction-list-create'))
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		results = response.data.get('results', response.data)
		ids = [t['id'] for t in results]
		self.assertNotIn(self.bob_tx.id, ids)

	def test_user_cannot_retrieve_other_users_transaction(self):
		self.client.force_authenticate(user=self.alice)
		response = self.client.get(reverse('transaction-detail', kwargs={'pk': self.bob_tx.id}))
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

	def test_user_cannot_delete_other_users_transaction(self):
		self.client.force_authenticate(user=self.alice)
		response = self.client.delete(reverse('transaction-detail', kwargs={'pk': self.bob_tx.id}))
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
		self.assertTrue(Transaction.objects.filter(id=self.bob_tx.id).exists())

	def test_unauthenticated_access_is_rejected(self):
		response = self.client.get(reverse('transaction-list-create'))
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AutoCategorizationApiTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(email='cat@zenspend.local', password='StrongPass123!')
		self.category = Category.objects.create(name='Courses', user=self.user, is_expense=True)
		TransactionRule.objects.create(
			name='Supermarche',
			user=self.user,
			keywords=['carrefour', 'auchan'],
			assign_category=self.category,
			is_active=True,
		)
		self.client.force_authenticate(user=self.user)

	def test_matching_transaction_gets_category_assigned(self):
		response = self.client.post(
			reverse('transaction-list-create'),
			{'amount': '42.50', 'description': 'Achat CARREFOUR City'},
			format='json',
		)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		tx = Transaction.objects.get(user=self.user, description='Achat CARREFOUR City')
		self.assertEqual(tx.category_id, self.category.id)

	def test_non_matching_transaction_has_no_category(self):
		response = self.client.post(
			reverse('transaction-list-create'),
			{'amount': '10.00', 'description': 'Restaurant'},
			format='json',
		)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		tx = Transaction.objects.get(user=self.user, description='Restaurant')
		self.assertIsNone(tx.category_id)


class CsvImportApiTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(email='csv@zenspend.local', password='StrongPass123!')
		self.client.force_authenticate(user=self.user)

	def test_csv_upload_creates_and_dedupes(self):
		csv_content = (
			b'Date;Libelle;Montant\n'
			b'2026-01-05;CARREFOUR;-42,50\n'
			b'2026-01-06;Salaire;1 800,00\n'
			b'2026-01-05;CARREFOUR;-42,50\n'
		)
		upload = SimpleUploadedFile('releve.csv', csv_content, content_type='text/csv')
		response = self.client.post(
			reverse('import-session-upload'),
			{'file': upload},
			format='multipart',
		)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data['created'], 2)
		self.assertEqual(response.data['duplicates'], 1)
		self.assertEqual(Transaction.objects.filter(user=self.user).count(), 2)

	def test_upload_without_file_returns_400(self):
		response = self.client.post(reverse('import-session-upload'), {}, format='multipart')
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class NotificationGenerationApiTests(APITestCase):
	def setUp(self):
		self.user = User.objects.create_user(email='notif@zenspend.local', password='StrongPass123!')
		self.client.force_authenticate(user=self.user)

	def test_budget_alert_created_when_threshold_exceeded(self):
		Budget.objects.create(
			user=self.user, name='Courses', amount='100.00',
			current_amount='95.00', alert_threshold='80.00',
		)
		# Creating a transaction triggers the opportunistic notification check.
		self.client.post(
			reverse('transaction-list-create'),
			{'amount': '5.00', 'description': 'Trigger'},
			format='json',
		)
		self.assertTrue(
			Notification.objects.filter(user=self.user, type='budget_alert').exists()
		)

	def test_goal_reached_notification_created(self):
		SavingsGoal.objects.create(
			user=self.user, name='Vacances', target_amount='500.00', current_amount='500.00',
		)
		self.client.post(
			reverse('transaction-list-create'),
			{'amount': '5.00', 'description': 'Trigger'},
			format='json',
		)
		self.assertTrue(
			Notification.objects.filter(user=self.user, type='goal_reached').exists()
		)


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class ContactApiTests(APITestCase):
	def test_contact_endpoint_sends_email(self):
		response = self.client.post(
			reverse('contact'),
			{
				'name': 'Visiteur',
				'email': 'visiteur@example.com',
				'subject': 'Bonjour',
				'message': 'Question sur ZenSpend',
			},
			format='json',
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(mail.outbox), 1)
		self.assertIn('Bonjour', mail.outbox[0].subject)

	def test_contact_endpoint_validates_email(self):
		response = self.client.post(
			reverse('contact'),
			{'name': 'X', 'email': 'not-an-email', 'subject': 'S', 'message': 'M'},
			format='json',
		)
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class RecurringTransactionTests(APITestCase):
	def test_due_schedule_generates_and_advances(self):
		from datetime import timedelta
		from django.utils import timezone
		from .models import RecurringSchedule
		from .services.recurring import generate_due_recurring_transactions

		user = User.objects.create_user(email='rec@zenspend.local', password='StrongPass123!')
		template = Transaction.objects.create(
			user=user, amount='9.99', description='Abonnement',
			date=timezone.now() - timedelta(days=40),
		)
		schedule = RecurringSchedule.objects.create(
			transaction=template,
			frequency='monthly',
			start_date=timezone.now() - timedelta(days=40),
			next_occurrence=timezone.now() - timedelta(days=35),
		)

		created = generate_due_recurring_transactions()
		schedule.refresh_from_db()

		self.assertGreaterEqual(created, 1)
		self.assertGreater(schedule.next_occurrence, timezone.now())
		# Idempotent: running again generates nothing.
		self.assertEqual(generate_due_recurring_transactions(), 0)
