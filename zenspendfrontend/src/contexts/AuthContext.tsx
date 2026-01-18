import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { toast } from 'react-hot-toast';



// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    preferred_currency: string;
    password: string;
    password_confirm: string;
  }) => Promise<void>;

  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;

  // API Methods
  fetchTransactions: () => Promise<any[]>;
  createTransaction: (data: any) => Promise<any>;
  updateTransaction: (id: string, data: any) => Promise<any>;
  deleteTransaction: (id: string) => Promise<void>;

  fetchAccounts: () => Promise<any[]>;
  createAccount: (data: any) => Promise<any>;
  updateAccount: (id: string, data: any) => Promise<any>;
  deleteAccount: (id: string) => Promise<void>;

  fetchBudgets: () => Promise<any[]>;
  createBudget: (data: any) => Promise<any>;
  updateBudget: (id: string, data: any) => Promise<any>;
  deleteBudget: (id: string) => Promise<void>;

  fetchGoals: () => Promise<any[]>;
  createGoal: (data: any) => Promise<any>;
  updateGoal: (id: string, data: any) => Promise<any>;
  deleteGoal: (id: string) => Promise<void>;

  fetchCategories: () => Promise<any[]>;
  createCategory: (data: any) => Promise<any>;

  fetchDashboardData: () => Promise<any>;
  fetchMonthlyExpenses: () => Promise<any[]>;
  fetchCategoryData: () => Promise<any>;

  fetchDebts: () => Promise<any[]>;
  fetchNotifications: () => Promise<any[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;



  // Clear all auth data
  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  };

  // API Helper function
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',

      ...options.headers as Record<string, string>,
    };

    // Add auth header if token exists and it's not a login/register request
    if (token && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    console.log('API Call:', {
      url,
      method: requestOptions.method || 'GET',
      headers,
      body: requestOptions.body,
    });

    try {
      const response = await fetch(url, requestOptions);

      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      // Handle different response statuses
      if (response.status === 401) {
        console.warn('Unauthorized - clearing auth data');
        clearAuthData();
        throw new Error('Session expirée, veuillez vous reconnecter');
      }

      if (response.status === 403) {
        throw new Error('Accès refusé');
      }

      if (response.status === 404) {
        throw new Error('Ressource non trouvée');
      }

      if (response.status >= 500) {
        throw new Error('Erreur serveur, veuillez réessayer plus tard');
      }

      // Try to parse JSON response
      let responseData;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        // Handle error responses
        const errorMessage = responseData?.message ||
          responseData?.detail ||
          responseData?.error ||
          `Erreur HTTP: ${response.status}`;
        throw new Error(errorMessage);
      }

      console.log('API Response Data:', responseData);
      return responseData;

    } catch (error) {
      console.error('API call failed:', {
        endpoint,
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion.');
      }

      throw error;
    }
  };

  // Authentication methods
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Attempting login for:', email);

      const response = await apiCall('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (!response.access || !response.user) {
        throw new Error('Réponse de connexion invalide');
      }

      setToken(response.access);
      setUser(response.user);
      localStorage.setItem('token', response.access);

      if (response.refresh) {
        localStorage.setItem('refresh_token', response.refresh);
      }

      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      console.error('Login failed:', error);
      clearAuthData();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: any) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json();
      if (response.ok) {
        toast.success('Inscription réussie !');
        return responseData;
      } else {
        throw new Error(responseData.message || 'Erreur lors de l\'inscription');
      }
    } catch (error: any) {
      console.error('Signup failed:', error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };


  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');

    // If we have a refresh token, call the logout endpoint
    if (refreshToken) {
      try {
        await apiCall('/auth/logout/', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (error) {
        console.error('Logout API call failed:', error);
        // Continue with local cleanup even if API call fails
      }
    }

    clearAuthData();
    console.log('User logged out');
  };

  const refreshToken = async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      await logout();
      return;
    }

    try {
      console.log('Refreshing token...');

      const response = await apiCall('/auth/refresh/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
      });

      if (!response.access) {
        throw new Error('Invalid refresh response');
      }

      setToken(response.access);
      localStorage.setItem('token', response.access);
      console.log('Token refreshed successfully');

    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      throw error;
    }
  };

  // Mappers
  const mapAccount = (data: any) => ({
    ...data,
    type: data.account_type || data.type,
  });

  const mapBudget = (data: any) => ({
    ...data,
    spent: parseFloat(data.current_amount) || 0,
    amount: parseFloat(data.amount) || 0,
    category: data.categories && data.categories.length > 0 ? 'Multi' : 'General',
  });

  const mapGoal = (data: any) => ({
    ...data,
    name: data.name || 'Objectif sans nom',
    targetAmount: parseFloat(data.target_amount) || parseFloat(data.targetAmount) || 0,
    currentAmount: parseFloat(data.current_amount) || parseFloat(data.currentAmount) || 0,
    targetDate: data.deadline || data.targetDate || new Date().toISOString(),
  });

  const mapTransaction = (data: any) => ({
    ...data,
    description: data.description || 'Sans description',
    amount: Math.abs(parseFloat(data.amount)) || 0,
    accountId: data.account || data.accountId,
    type: data.type || (parseFloat(data.amount) < 0 ? 'expense' : 'income'),
  });

  // Transaction methods
  const fetchTransactions = React.useCallback(async () => {
    const data = await apiCall('/transactions/');
    return (data || []).map(mapTransaction);
  }, [token]);

  const createTransaction = React.useCallback((data: any) => apiCall('/transactions/', { method: 'POST', body: JSON.stringify(data) }), [token]);
  const updateTransaction = React.useCallback((id: string, data: any) => apiCall(`/transactions/${id}/`, { method: 'PUT', body: JSON.stringify(data) }), [token]);
  const deleteTransaction = React.useCallback((id: string) => apiCall(`/transactions/${id}/`, { method: 'DELETE' }), [token]);

  // Account methods
  const fetchAccounts = React.useCallback(async () => {
    const data = await apiCall('/accounts/');
    return (data || []).map(mapAccount);
  }, [token]);

  const createAccount = React.useCallback((data: any) => apiCall('/accounts/', { method: 'POST', body: JSON.stringify(data) }), [token]);
  const updateAccount = React.useCallback((id: string, data: any) => apiCall(`/accounts/${id}/`, { method: 'PUT', body: JSON.stringify(data) }), [token]);
  const deleteAccount = React.useCallback((id: string) => apiCall(`/accounts/${id}/`, { method: 'DELETE' }), [token]);

  // Budget methods
  const fetchBudgets = React.useCallback(async () => {
    const data = await apiCall('/budgets/');
    return (data || []).map(mapBudget);
  }, [token]);

  const createBudget = React.useCallback((data: any) => apiCall('/budgets/', { method: 'POST', body: JSON.stringify(data) }), [token]);
  const updateBudget = React.useCallback((id: string, data: any) => apiCall(`/budgets/${id}/`, { method: 'PUT', body: JSON.stringify(data) }), [token]);
  const deleteBudget = React.useCallback((id: string) => apiCall(`/budgets/${id}/`, { method: 'DELETE' }), [token]);

  // Goals methods
  const fetchGoals = React.useCallback(async () => {
    const data = await apiCall('/savings-goals/');
    return (data || []).map(mapGoal);
  }, [token]);

  const createGoal = React.useCallback((data: any) => apiCall('/savings-goals/', { method: 'POST', body: JSON.stringify(data) }), [token]);
  const updateGoal = React.useCallback((id: string, data: any) => apiCall(`/savings-goals/${id}/`, { method: 'PUT', body: JSON.stringify(data) }), [token]);
  const deleteGoal = React.useCallback((id: string) => apiCall(`/savings-goals/${id}/`, { method: 'DELETE' }), [token]);

  // Category methods
  const fetchCategories = React.useCallback(() => apiCall('/categories/'), [token]);
  const createCategory = React.useCallback((data: any) => apiCall('/categories/', { method: 'POST', body: JSON.stringify(data) }), [token]);

  // Dashboard data methods
  const fetchDashboardData = React.useCallback(() => apiCall('/dashboard/'), [token]);
  const fetchMonthlyExpenses = React.useCallback(() => apiCall('/analytics/monthly-expenses/'), [token]);
  const fetchCategoryData = React.useCallback(() => apiCall('/analytics/category-distribution/'), [token]);

  const fetchDebts = React.useCallback(() => apiCall('/debts/'), [token]);
  const fetchNotifications = React.useCallback(() => apiCall('/notifications/'), [token]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      console.log('Initializing auth...');

      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('Found stored auth data for user:', parsedUser);

          setToken(storedToken);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          clearAuthData();
        }
      } else {
        console.log('No stored auth data found');
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    refreshToken,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    fetchCategories,
    createCategory,
    fetchDashboardData,
    fetchMonthlyExpenses,
    fetchCategoryData,
    fetchDebts,
    fetchNotifications,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};