// Authentication state for the mobile app.
//
// Mirrors the responsibilities of the web AuthContext but persists tokens in
// SecureStore and exposes a small surface — feature screens call the typed
// `*Api` resource modules directly rather than going through this context.
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { authApi, SignupData } from '../api/auth';
import { setOnSessionExpired } from '../api/client';
import { tokenStore } from '../api/tokenStore';
import { userApi } from '../api/resources';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingCompleted: boolean | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);

  const isAuthenticated = !!user;

  const clearSession = useCallback(async () => {
    await tokenStore.clear();
    setUser(null);
    setOnboardingCompleted(null);
  }, []);

  // Let the API client force a logout when token refresh fails.
  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null);
      setOnboardingCompleted(null);
    });
    return () => setOnSessionExpired(null);
  }, []);

  // Restore a cached session on cold start.
  useEffect(() => {
    (async () => {
      try {
        const [token, cachedUser] = await Promise.all([
          tokenStore.getAccess(),
          tokenStore.getUser(),
        ]);
        if (token && cachedUser) {
          setUser(cachedUser);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Load onboarding status once authenticated.
  useEffect(() => {
    if (!isAuthenticated) return;
    userApi
      .preferences()
      .then((data: any) => {
        if (data && typeof data.onboarding_completed === 'boolean') {
          setOnboardingCompleted(data.onboarding_completed);
        } else {
          setOnboardingCompleted(true);
        }
      })
      .catch(() => setOnboardingCompleted(true));
  }, [isAuthenticated]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    if (!res.access || !res.user) {
      throw new Error('Réponse de connexion invalide');
    }
    await tokenStore.setTokens(res.access, res.refresh);
    await tokenStore.setUser(res.user);
    setUser(res.user);
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    await authApi.register(data);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    await clearSession();
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const fresh = await userApi.profile();
    await tokenStore.setUser(fresh);
    setUser(fresh);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await userApi.completeOnboarding();
    setOnboardingCompleted(true);
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    const updated = await userApi.updateProfile(data);
    await tokenStore.setUser(updated);
    setUser(updated);
    return updated;
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    onboardingCompleted,
    login,
    signup,
    logout,
    refreshUser,
    completeOnboarding,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
