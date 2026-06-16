// Local mock data for design / display iteration.
// Enabled with EXPO_PUBLIC_USE_MOCKS=true — `apiRequest` then short-circuits GET
// calls to these fixtures (no network). Shapes match the RAW API payloads, so the
// mappers in resources.ts still run on top of them.

export const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === 'true';

export const MOCK_USER = {
  id: 'mock-1',
  first_name: 'Mathieu',
  last_name: 'Atsou',
  email: 'mathieu@zenspend.local',
  phone_number: '0612345678',
  preferred_currency: 'EUR',
  user_segment: 'young_professionals' as const,
};

const categoryDistribution = {
  labels: ['Logement', 'Alimentation', 'Transport', 'Loisirs', 'Santé'],
  data: [780, 420, 210, 165, 95],
  colors: ['#FF7F00', '#00A4E6', '#8B5CF6', '#22C55E', '#EAB308'],
};

const mocks: Record<string, unknown> = {
  // Dashboard — clés camelCase lues par l'écran d'accueil (+ snake_case par sécurité).
  '/dashboard/': {
    totalBalance: 8432.55,
    monthlyIncome: 3200,
    monthlyExpenses: 1875.4,
    savingsRate: 0.41,
    currency: 'EUR',
    total_balance: 8432.55,
    monthly_income: 3200,
    monthly_expenses: 1875.4,
  },

  '/analytics/category-distribution/': categoryDistribution,

  '/analytics/monthly-expenses/': [
    { month: 'Jan', income: 3100, expenses: 1950 },
    { month: 'Fév', income: 3200, expenses: 1740 },
    { month: 'Mar', income: 3200, expenses: 2100 },
    { month: 'Avr', income: 3350, expenses: 1680 },
    { month: 'Mai', income: 3200, expenses: 1875 },
  ],

  // Raw transaction shapes (mapTransaction dérive type/amount/accountId).
  '/transactions/': [
    { id: 't1', description: 'Salaire', amount: '3200.00', account: 'a1', date: '2026-06-01', category: 'Revenu' },
    { id: 't2', description: 'Loyer', amount: '-780.00', account: 'a1', date: '2026-06-03', category: 'Logement' },
    { id: 't3', description: 'Courses Carrefour', amount: '-86.40', account: 'a1', date: '2026-06-08', category: 'Alimentation' },
    { id: 't4', description: 'Essence', amount: '-62.10', account: 'a1', date: '2026-06-09', category: 'Transport' },
    { id: 't5', description: 'Cinéma', amount: '-24.00', account: 'a1', date: '2026-06-10', category: 'Loisirs' },
    { id: 't6', description: 'Pharmacie', amount: '-18.50', account: 'a2', date: '2026-06-11', category: 'Santé' },
  ],

  // Raw account shapes (mapAccount dérive type/balance).
  '/accounts/': [
    { id: 'a1', name: 'Compte courant', account_type: 'checking', balance: '2450.55', currency: 'EUR' },
    { id: 'a2', name: 'Livret A', account_type: 'savings', balance: '5982.00', currency: 'EUR' },
    { id: 'a3', name: 'Carte de crédit', account_type: 'credit', balance: '-340.00', currency: 'EUR' },
  ],

  // Raw budget shapes (mapBudget dérive spent/amount).
  '/budgets/': [
    { id: 'b1', name: 'Alimentation', amount: '500', current_amount: '420', categories: [1] },
    { id: 'b2', name: 'Loisirs', amount: '250', current_amount: '165', categories: [2] },
    { id: 'b3', name: 'Transport', amount: '300', current_amount: '210', categories: [3] },
  ],

  // Raw goal shapes (mapGoal dérive targetAmount/currentAmount/targetDate).
  '/savings-goals/': [
    { id: 'g1', name: 'Vacances été', target_amount: '3000', current_amount: '1850', deadline: '2026-07-15' },
    { id: 'g2', name: "Fonds d'urgence", target_amount: '6000', current_amount: '4200', deadline: '2026-12-31' },
  ],

  '/categories/': [
    { id: '1', name: 'Alimentation', color: '#00A4E6', icon: 'cart' },
    { id: '2', name: 'Loisirs', color: '#22C55E', icon: 'game-controller' },
    { id: '3', name: 'Transport', color: '#8B5CF6', icon: 'car' },
    { id: '4', name: 'Logement', color: '#FF7F00', icon: 'home' },
  ],

  '/notifications/': [
    { id: 1, title: 'Budget Alimentation', message: 'Vous avez utilisé 84 % de votre budget.', notification_type: 'budget', is_read: false, created_at: '2026-06-11T09:00:00Z' },
    { id: 2, title: 'Objectif Vacances été', message: 'Plus que 1 150 € pour atteindre votre objectif.', notification_type: 'goal', is_read: false, created_at: '2026-06-10T18:30:00Z' },
    { id: 3, title: 'Nouvelle fonctionnalité', message: 'Découvrez le suivi des dettes.', notification_type: 'info', is_read: true, created_at: '2026-06-08T12:00:00Z' },
  ],

  '/debt-trackers/': [
    { id: 1, name: 'Prêt auto', total_amount: '12000', remaining_amount: '7400', interest_rate: '3.2', minimum_payment: '280', due_date: '2026-06-28', debt_type: 'loan' },
  ],

  '/user-preferences/': { onboarding_completed: true },

  // Bank integration availability (read by the connect-bank screen).
  '/integrations/banking/status/': {
    status: 'ok',
    integration: { provider: 'mock', configured: true },
    capabilities: { create_link_session: true },
  },
};

/** Returns mock data for a GET endpoint, or undefined if none is defined. */
export function getMock(endpoint: string): unknown | undefined {
  const path = endpoint.split('?')[0];
  return mocks[path];
}

/**
 * Mock responses for bank-integration writes (POST), so the connect-bank flow
 * is exercisable end-to-end without a backend. The link-session URL points back
 * at the app's deep link so the consent "return" re-enters connect-bank.
 */
export function getMockBankWrite(endpoint: string, body: any): unknown | undefined {
  if (endpoint.includes('/integrations/banking/link-session/')) {
    const redirect = body?.redirect_uri || 'zenspend://connect-bank';
    const connectionId = `mock_${Date.now()}`;
    const state = body?.state || '';
    const sep = redirect.includes('?') ? '&' : '?';
    return {
      status: 'success',
      link_session: {
        session_id: connectionId,
        provider: 'mock',
        link_url: `${redirect}${sep}external_connection_id=${connectionId}&provider=mock&state=${state}`,
        expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
        state,
      },
    };
  }
  if (endpoint.includes('/integrations/banking/callback/')) {
    return {
      status: 'success',
      created: true,
      bank_connection: { id: 1, provider: 'mock', external_connection_id: body?.external_connection_id, status: 'connected' },
      accounts_connected: 1,
    };
  }
  if (endpoint.includes('/integrations/banking/sync-from-provider/')) {
    return {
      status: 'success',
      connection_id: body?.connection_id ?? 1,
      fetched_transactions: 3,
      sync_result: { created: 3, updated: 0, duplicates: 0, skipped: 0 },
    };
  }
  return undefined;
}
