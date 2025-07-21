import { SubscriptionPlan, FeatureAccess, SubscriptionTier } from '../types/subscription';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: 0,
    currency: 'EUR',
    interval: 'monthly',
    features: [
      'Jusqu\'à 2 comptes bancaires',
      '100 transactions par mois',
      '3 budgets maximum',
      'Rapports de base',
      'Support communautaire'
    ],
    maxAccounts: 2,
    maxTransactions: 100,
    maxBudgets: 3,
    maxGoals: 2
  },
  {
    id: 'basic',
    name: 'Essentiel',
    price: 4.99,
    currency: 'EUR',
    interval: 'monthly',
    features: [
      'Jusqu\'à 5 comptes bancaires',
      '500 transactions par mois',
      '10 budgets maximum',
      '5 objectifs d\'épargne',
      'Rapports avancés',
      'Export des données',
      'Support par email'
    ],
    maxAccounts: 5,
    maxTransactions: 500,
    maxBudgets: 10,
    maxGoals: 5,
    stripePriceId: 'price_basic_monthly'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    currency: 'EUR',
    interval: 'monthly',
    features: [
      'Comptes illimités',
      'Transactions illimitées',
      'Budgets illimités',
      'Objectifs d\'épargne illimités',
      'Catégorisation automatique',
      'Multi-devises',
      'Rapports personnalisés',
      'Synchronisation bancaire',
      'Support prioritaire'
    ],
    maxAccounts: -1, // -1 = unlimited
    maxTransactions: -1,
    maxBudgets: -1,
    maxGoals: -1,
    isPopular: true,
    stripePriceId: 'price_premium_monthly'
  },
  {
    id: 'pro',
    name: 'Professionnel',
    price: 19.99,
    currency: 'EUR',
    interval: 'monthly',
    features: [
      'Toutes les fonctionnalités Premium',
      'Suivi des investissements',
      'Analyse fiscale',
      'API d\'intégration',
      'Rapports d\'entreprise',
      'Support téléphonique dédié',
      'Gestionnaire de compte personnel'
    ],
    maxAccounts: -1,
    maxTransactions: -1,
    maxBudgets: -1,
    maxGoals: -1,
    stripePriceId: 'price_pro_monthly'
  }
];

export const getFeatureAccess = (tier: SubscriptionTier): FeatureAccess => {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === tier);
  
  if (!plan) {
    return getFreeFeatureAccess();
  }

  return {
    canAccessAdvancedReports: tier !== 'free',
    canCreateUnlimitedBudgets: tier === 'premium' || tier === 'pro',
    canUseGoalTracking: tier !== 'free',
    canExportData: tier !== 'free',
    canUseMultiCurrency: tier === 'premium' || tier === 'pro',
    canAccessPremiumSupport: tier === 'premium' || tier === 'pro',
    canUseAutomaticCategorization: tier === 'premium' || tier === 'pro',
    canAccessInvestmentTracking: tier === 'pro',
    maxAccounts: plan.maxAccounts,
    maxTransactions: plan.maxTransactions,
    maxBudgets: plan.maxBudgets,
    maxGoals: plan.maxGoals
  };
};

export const getFreeFeatureAccess = (): FeatureAccess => {
  const freePlan = SUBSCRIPTION_PLANS.find(p => p.id === 'free')!;
  
  return {
    canAccessAdvancedReports: false,
    canCreateUnlimitedBudgets: false,
    canUseGoalTracking: false,
    canExportData: false,
    canUseMultiCurrency: false,
    canAccessPremiumSupport: false,
    canUseAutomaticCategorization: false,
    canAccessInvestmentTracking: false,
    maxAccounts: freePlan.maxAccounts,
    maxTransactions: freePlan.maxTransactions,
    maxBudgets: freePlan.maxBudgets,
    maxGoals: freePlan.maxGoals
  };
};

export const getPlanByTier = (tier: SubscriptionTier): SubscriptionPlan => {
  return SUBSCRIPTION_PLANS.find(p => p.id === tier) || SUBSCRIPTION_PLANS[0];
};