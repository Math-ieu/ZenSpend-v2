export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  maxAccounts: number;
  maxTransactions: number;
  maxBudgets: number;
  maxGoals: number;
  isPopular?: boolean;
  stripePriceId?: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureAccess {
  canAccessAdvancedReports: boolean;
  canCreateUnlimitedBudgets: boolean;
  canUseGoalTracking: boolean;
  canExportData: boolean;
  canUseMultiCurrency: boolean;
  canAccessPremiumSupport: boolean;
  canUseAutomaticCategorization: boolean;
  canAccessInvestmentTracking: boolean;
  maxAccounts: number;
  maxTransactions: number;
  maxBudgets: number;
  maxGoals: number;
}

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'pro';