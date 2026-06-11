import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserSubscription, SubscriptionPlan, FeatureAccess, SubscriptionTier } from '../types/subscription';
import { getFeatureAccess, getFreeFeatureAccess, SUBSCRIPTION_PLANS } from '../lib/subscriptionPlans';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../lib/config';
import toast from 'react-hot-toast';

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  currentPlan: SubscriptionPlan | null;
  featureAccess: FeatureAccess; 
  isLoading: boolean; 
  
  // Subscription management
  subscribeToPlan: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  updateSubscription: (planId: string) => Promise<void>;
  
  // Feature gating
  hasFeature: (feature: keyof FeatureAccess) => boolean;
  canCreateMore: (type: 'accounts' | 'transactions' | 'budgets' | 'goals', currentCount: number) => boolean;
  
  // Subscription flow state
  pendingPlanId: string | null;
  setPendingPlanId: (planId: string | null) => void;
  
  // Plans
  availablePlans: SubscriptionPlan[];
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, token } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);

  // Get current plan based on subscription
  const currentPlan = subscription 
    ? SUBSCRIPTION_PLANS.find(p => p.id === subscription.planId) || SUBSCRIPTION_PLANS[0]
    : SUBSCRIPTION_PLANS[0]; // Default to free plan

  // Get feature access based on current plan
  const featureAccess = subscription && subscription.status === 'active'
    ? getFeatureAccess(subscription.planId as SubscriptionTier)
    : getFreeFeatureAccess();

  // API helper function
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  // Fetch user subscription
  const fetchSubscription = async () => {
    if (!isAuthenticated || !user) return;

    setIsLoading(true);
    try {
      const data = await apiCall('/subscriptions/current/');
      setSubscription(data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      // Set to null for free tier
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to a plan
  const subscribeToPlan = async (planId: string) => {
    if (!isAuthenticated) {
      // Store the intended plan and redirect to login
      setPendingPlanId(planId);
      throw new Error('authentication_required');
    }

    setIsLoading(true);
    try {
      const data = await apiCall('/subscriptions/subscribe/', {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId }),
      });

      setSubscription(data.subscription);
      
      // Handle Stripe checkout if needed
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast.success('Abonnement activé avec succès !');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'abonnement');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    if (!subscription) return;

    setIsLoading(true);
    try {
      const data = await apiCall('/subscriptions/cancel/', {
        method: 'POST',
      });

      setSubscription(data);
      toast.success('Abonnement annulé avec succès');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'annulation');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update subscription
  const updateSubscription = async (planId: string) => {
    if (!subscription) return;

    setIsLoading(true);
    try {
      const data = await apiCall('/subscriptions/update/', {
        method: 'PUT',
        body: JSON.stringify({ plan_id: planId }),
      });

      setSubscription(data);
      toast.success('Abonnement mis à jour avec succès !');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Feature gating helpers
  const hasFeature = (feature: keyof FeatureAccess): boolean => {
    return Boolean(featureAccess[feature]);
  };

  const canCreateMore = (type: 'accounts' | 'transactions' | 'budgets' | 'goals', currentCount: number): boolean => {
    const limits = {
      accounts: featureAccess.maxAccounts,
      transactions: featureAccess.maxTransactions,
      budgets: featureAccess.maxBudgets,
      goals: featureAccess.maxGoals
    };

    const limit = limits[type];
    return limit === -1 || currentCount < limit;
  };

  // Load subscription on auth change
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSubscription();
    } else {
      setSubscription(null);
    }
  }, [isAuthenticated, user]);

  const value: SubscriptionContextType = {
    subscription,
    currentPlan,
    featureAccess,
    isLoading,
    subscribeToPlan,
    cancelSubscription,
    updateSubscription,
    hasFeature,
    canCreateMore,
    pendingPlanId,
    setPendingPlanId,
    availablePlans: SUBSCRIPTION_PLANS,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};