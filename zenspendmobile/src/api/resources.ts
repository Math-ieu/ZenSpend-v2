// Resource-level API calls, ported from the web AuthContext.
// Each function maps the raw DRF payload into the shapes the UI expects.
import { apiRequest, asList } from './client';
import type {
  Account,
  Budget,
  Category,
  DashboardSummary,
  DebtTracker,
  MonthlyExpense,
  NotificationItem,
  SavingsGoal,
  Transaction,
  User,
} from '../types';

// ---- mappers ---------------------------------------------------------------

const mapAccount = (d: any): Account => ({
  ...d,
  type: d.account_type || d.type,
  balance: parseFloat(d.balance) || 0,
});

const mapBudget = (d: any): Budget => ({
  ...d,
  spent: parseFloat(d.current_amount) || 0,
  amount: parseFloat(d.amount) || 0,
  category: d.categories && d.categories.length > 0 ? 'Multi' : 'General',
});

const mapGoal = (d: any): SavingsGoal => ({
  ...d,
  name: d.name || 'Objectif sans nom',
  targetAmount: parseFloat(d.target_amount) || parseFloat(d.targetAmount) || 0,
  currentAmount: parseFloat(d.current_amount) || parseFloat(d.currentAmount) || 0,
  targetDate: d.deadline || d.targetDate || new Date().toISOString(),
});

const mapTransaction = (d: any): Transaction => ({
  ...d,
  description: d.description || 'Sans description',
  amount: Math.abs(parseFloat(d.amount)) || 0,
  accountId: d.account || d.accountId,
  type: d.type || (parseFloat(d.amount) < 0 ? 'expense' : 'income'),
});

// ---- transactions ----------------------------------------------------------

export const transactionsApi = {
  list: async () => asList(await apiRequest('/transactions/')).map(mapTransaction),
  create: (data: any) => apiRequest('/transactions/', { method: 'POST', body: data }),
  update: (id: string, data: any) =>
    apiRequest(`/transactions/${id}/`, { method: 'PUT', body: data }),
  remove: (id: string) => apiRequest(`/transactions/${id}/`, { method: 'DELETE' }),
};

// ---- accounts --------------------------------------------------------------

export const accountsApi = {
  list: async () => asList(await apiRequest('/accounts/')).map(mapAccount),
  create: (data: any) => apiRequest('/accounts/', { method: 'POST', body: data }),
  update: (id: string, data: any) =>
    apiRequest(`/accounts/${id}/`, { method: 'PUT', body: data }),
  remove: (id: string) => apiRequest(`/accounts/${id}/`, { method: 'DELETE' }),
};

// ---- budgets ---------------------------------------------------------------

export const budgetsApi = {
  list: async () => asList(await apiRequest('/budgets/')).map(mapBudget),
  create: (data: any) => apiRequest('/budgets/', { method: 'POST', body: data }),
  update: (id: string, data: any) =>
    apiRequest(`/budgets/${id}/`, { method: 'PUT', body: data }),
  remove: (id: string) => apiRequest(`/budgets/${id}/`, { method: 'DELETE' }),
};

// ---- savings goals ---------------------------------------------------------

export const goalsApi = {
  list: async () => asList(await apiRequest('/savings-goals/')).map(mapGoal),
  create: (data: any) => apiRequest('/savings-goals/', { method: 'POST', body: data }),
  update: (id: string, data: any) =>
    apiRequest(`/savings-goals/${id}/`, { method: 'PUT', body: data }),
  remove: (id: string) => apiRequest(`/savings-goals/${id}/`, { method: 'DELETE' }),
};

// ---- categories ------------------------------------------------------------

export const categoriesApi = {
  list: async () => asList<Category>(await apiRequest('/categories/')),
  create: (data: any) => apiRequest('/categories/', { method: 'POST', body: data }),
};

// ---- debts / notifications -------------------------------------------------

export const debtsApi = {
  list: async () => asList<DebtTracker>(await apiRequest('/debt-trackers/')),
  create: (data: any) => apiRequest('/debt-trackers/', { method: 'POST', body: data }),
  update: (id: number, data: any) =>
    apiRequest(`/debt-trackers/${id}/`, { method: 'PATCH', body: data }),
  remove: (id: number) => apiRequest(`/debt-trackers/${id}/`, { method: 'DELETE' }),
};

export const notificationsApi = {
  list: async () => asList<NotificationItem>(await apiRequest('/notifications/')),
  markRead: (id: number) =>
    apiRequest(`/notifications/${id}/`, { method: 'PATCH', body: { is_read: true } }),
};

// ---- dashboard / analytics -------------------------------------------------

export const dashboardApi = {
  summary: () => apiRequest<DashboardSummary>('/dashboard/'),
  monthlyExpenses: async () =>
    asList<MonthlyExpense>(await apiRequest('/analytics/monthly-expenses/')),
  categoryDistribution: () => apiRequest('/analytics/category-distribution/'),
};

// ---- bank integration (DSP2 / GoCardless) ----------------------------------

export interface BankLinkSessionResponse {
  status: string;
  link_session?: {
    session_id: string;
    provider: string;
    link_url: string;
    expires_at: string;
    state: string;
  };
}

export const bankApi = {
  // Provider availability + whether a link session can be created.
  status: () => apiRequest('/integrations/banking/status/'),
  // Starts a consent flow: returns the hosted bank link URL to open.
  createLinkSession: (payload: { redirect_uri?: string; state?: string }) =>
    apiRequest<BankLinkSessionResponse>('/integrations/banking/link-session/', {
      method: 'POST',
      body: payload,
    }),
  // Registers the connection (+ optional accounts) once the user consented.
  processCallback: (payload: {
    external_connection_id: string;
    provider?: string;
    institution_name?: string;
    status?: string;
    metadata?: Record<string, any>;
    accounts?: any[];
  }) => apiRequest('/integrations/banking/callback/', { method: 'POST', body: payload }),
  // Pulls transactions from the provider and imports them (idempotent).
  syncFromProvider: (payload: { connection_id: number }) =>
    apiRequest('/integrations/banking/sync-from-provider/', { method: 'POST', body: payload }),
};

// ---- user / preferences ----------------------------------------------------

export const userApi = {
  profile: () => apiRequest<User>('/users/profile/'),
  updateProfile: (data: Partial<User>) =>
    apiRequest<User>('/users/profile/', { method: 'PATCH', body: data }),
  preferences: () => apiRequest('/user-preferences/'),
  completeOnboarding: () =>
    apiRequest('/user-preferences/', { method: 'PATCH', body: { onboarding_completed: true } }),
  deleteAccount: () => apiRequest<void>('/users/profile/', { method: 'DELETE' }),
};
