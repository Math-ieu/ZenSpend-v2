import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { toast } from 'react-toastify';



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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data for user ID 1
const mockData = {
  user: {
    id: '1',
    first_name: 'Sophie',
    last_name: 'MARTIN',
    email: 'sophie.martin@example.com',
    avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=100',
  },
  transactions: [
    {
      id: 'tx-1',
      date: '2025-03-28',
      amount: 42.50,
      description: 'Supermarché Carrefour',
      category: 'Alimentation',
      type: 'expense',
      accountId: 'account-1',
    },
    {
      id: 'tx-2',
      date: '2025-03-27',
      amount: 9.90,
      description: 'Netflix Abonnement',
      category: 'Loisirs',
      type: 'expense',
      accountId: 'account-1',
    },
    {
      id: 'tx-3',
      date: '2025-03-25',
      amount: 2450.00,
      description: 'Salaire Mars',
      category: 'Salaire',
      type: 'income',
      accountId: 'account-1',
    },
  ],
  accounts: [
    {
      id: 'account-1',
      name: 'Compte Courant',
      balance: 2580.42,
      type: 'checking',
      currency: 'EUR',
    },
    {
      id: 'account-2',
      name: 'Livret A',
      balance: 12450.00,
      type: 'savings',
      currency: 'EUR',
    },
    {
      id: 'account-3',
      name: 'Carte Gold',
      balance: -450.30,
      type: 'credit',
      currency: 'EUR',
    },
  ],
  budgets: [
    {
      id: 'budget-1',
      name: 'Alimentation',
      amount: 400,
      spent: 325.50,
      category: 'Alimentation',
      period: 'monthly',
      startDate: '2025-03-01',
      endDate: '2025-03-31',
    },
    {
      id: 'budget-2',
      name: 'Transport',
      amount: 150,
      spent: 95.30,
      category: 'Transport',
      period: 'monthly',
      startDate: '2025-03-01',
      endDate: '2025-03-31',
    },
  ],
  goals: [
    {
      id: 'goal-1',
      name: 'Vacances Été',
      targetAmount: 1500,
      currentAmount: 750,
      targetDate: '2025-07-01',
      iconName: 'Palmtree',
    },
    {
      id: 'goal-2',
      name: 'Nouvel ordinateur',
      targetAmount: 1200,
      currentAmount: 320,
      targetDate: '2025-08-15',
      iconName: 'Laptop',
    },
  ],
  categories: [
    { id: 'cat-1', name: 'Alimentation', color: '#FF7F00', icon: 'Shopping' },
    { id: 'cat-2', name: 'Transport', color: '#0066FF', icon: 'Car' },
    { id: 'cat-3', name: 'Logement', color: '#8855FF', icon: 'Home' },
    { id: 'cat-4', name: 'Loisirs', color: '#33CC66', icon: 'Gamepad2' },
  ],
  monthlyExpenses: [
    { month: 'Jan', expenses: 1500, income: 3000 },
    { month: 'Fév', expenses: 1800, income: 3000 },
    { month: 'Mar', expenses: 1650, income: 3000 },
    { month: 'Avr', expenses: 1750, income: 3000 },
    { month: 'Mai', expenses: 1600, income: 3000 },
    { month: 'Juin', expenses: 1700, income: 3000 },
  ],
  categoryData: {
    labels: ['Alimentation', 'Transport', 'Logement', 'Loisirs', 'Santé', 'Shopping'],
    data: [25, 15, 35, 10, 5, 10],
    colors: ['#FF7F00', '#0066FF', '#8855FF', '#33CC66', '#FF3366', '#FFCC00'],
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  // Check if user ID is 1 and return mock data
  const shouldUseMockData = () => user?.id === '1';

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

      // For demo purposes, if email contains sophie, use mock data
      if (email.toLowerCase().includes('sophie')) {
        console.log('Using mock data for Sophie');
        const mockToken = 'mock-jwt-token-for-user-1';
        const mockRefreshToken = 'mock-refresh-token-for-user-1';
        
        setToken(mockToken);
        setUser(mockData.user);
        localStorage.setItem('token', mockToken);
        localStorage.setItem('refresh_token', mockRefreshToken);
        localStorage.setItem('user', JSON.stringify(mockData.user));
        return;
      }

      // Real API call
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

const signup = async (userData: {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  preferred_currency: string;
  password: string;
  password_confirm: string;
}) => {
  setIsLoading(true);
  
  try {
    console.log('Attempting signup for:', userData.email);

    // Appel API avec gestion des status intégrée
    const url = `${API_BASE_URL}/auth/register/`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const responseData = await response.json();

    // Gestion basée sur les status codes
    if (responseData.status_code === 201) {
      // Succès - Inscription réussie
      toast.success('Inscription réussie ! Bienvenue !', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      return responseData;

    } else {
     // Erreur
          toast.error(responseData.message);
          throw new Error(responseData.message);
    } 

  } catch (error) {
    console.error('Signup failed:', error);
    
    // Si l'erreur n'a pas déjà généré un toast (erreur réseau par exemple)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      toast.error('Impossible de se connecter au serveur. Vérifiez votre connexion.', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
    
    clearAuthData();
    throw error;
    
  } finally {
    setIsLoading(false);
  }
};


    const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    // If we have a refresh token and we're not using mock data, call the logout endpoint
    if (refreshToken && !shouldUseMockData()) {
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

  // Transaction methods
  const fetchTransactions = async () => {
    if (shouldUseMockData()) {
      return mockData.transactions;
    }
    return await apiCall('/transactions/');
  };

  const createTransaction = async (data: any) => {
    if (shouldUseMockData()) {
      const newTransaction = { ...data, id: `tx-${Date.now()}` };
      return newTransaction;
    }
    return await apiCall('/transactions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const updateTransaction = async (id: string, data: any) => {
    if (shouldUseMockData()) {
      return { ...data, id };
    }
    return await apiCall(`/transactions/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  };

  const deleteTransaction = async (id: string) => {
    if (shouldUseMockData()) {
      return;
    }
    await apiCall(`/transactions/${id}/`, {
      method: 'DELETE',
    });
  };

  // Account methods
  const fetchAccounts = async () => {
    if (shouldUseMockData()) {
      return mockData.accounts;
    }
    return await apiCall('/accounts/');
  };

  const createAccount = async (data: any) => {
    if (shouldUseMockData()) {
      const newAccount = { ...data, id: `account-${Date.now()}` };
      return newAccount;
    }
    return await apiCall('/accounts/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const updateAccount = async (id: string, data: any) => {
    if (shouldUseMockData()) {
      return { ...data, id };
    }
    return await apiCall(`/accounts/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  };

  const deleteAccount = async (id: string) => {
    if (shouldUseMockData()) {
      return;
    }
    await apiCall(`/accounts/${id}/`, {
      method: 'DELETE',
    });
  };

  // Budget methods
  const fetchBudgets = async () => {
    if (shouldUseMockData()) {
      return mockData.budgets;
    }
    return await apiCall('/budgets/');
  };

  const createBudget = async (data: any) => {
    if (shouldUseMockData()) {
      const newBudget = { ...data, id: `budget-${Date.now()}` };
      return newBudget;
    }
    return await apiCall('/budgets/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const updateBudget = async (id: string, data: any) => {
    if (shouldUseMockData()) {
      return { ...data, id };
    }
    return await apiCall(`/budgets/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  };

  const deleteBudget = async (id: string) => {
    if (shouldUseMockData()) {
      return;
    }
    await apiCall(`/budgets/${id}/`, {
      method: 'DELETE',
    });
  };

  // Goals methods
  const fetchGoals = async () => {
    if (shouldUseMockData()) {
      return mockData.goals;
    }
    return await apiCall('/savings-goals/');
  };

  const createGoal = async (data: any) => {
    if (shouldUseMockData()) {
      const newGoal = { ...data, id: `goal-${Date.now()}` };
      return newGoal;
    }
    return await apiCall('/savings-goals/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  const updateGoal = async (id: string, data: any) => {
    if (shouldUseMockData()) {
      return { ...data, id };
    }
    return await apiCall(`/savings-goals/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  };

  const deleteGoal = async (id: string) => {
    if (shouldUseMockData()) {
      return;
    }
    await apiCall(`/savings-goals/${id}/`, {
      method: 'DELETE',
    });
  };

  // Category methods
  const fetchCategories = async () => {
    if (shouldUseMockData()) {
      return mockData.categories;
    }
    return await apiCall('/categories/');
  };

  const createCategory = async (data: any) => {
    if (shouldUseMockData()) {
      const newCategory = { ...data, id: `cat-${Date.now()}` };
      return newCategory;
    }
    return await apiCall('/categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  // Dashboard data methods
  const fetchDashboardData = async () => {
    if (shouldUseMockData()) {
      return {
        totalBalance: mockData.accounts.reduce((sum, acc) => sum + acc.balance, 0),
        monthlyIncome: mockData.transactions
          .filter(tx => tx.type === 'income')
          .reduce((sum, tx) => sum + tx.amount, 0),
        monthlyExpenses: mockData.transactions
          .filter(tx => tx.type === 'expense')
          .reduce((sum, tx) => sum + tx.amount, 0),
      };
    }
    return await apiCall('/dashboard/');
  };

  const fetchMonthlyExpenses = async () => {
    if (shouldUseMockData()) {
      return mockData.monthlyExpenses;
    }
    return await apiCall('/analytics/monthly-expenses/');
  };

  const fetchCategoryData = async () => {
    if (shouldUseMockData()) {
      return mockData.categoryData;
    }
    return await apiCall('/analytics/category-distribution/');
  };

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