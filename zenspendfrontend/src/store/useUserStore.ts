// This file is now deprecated in favor of AuthContext
// Keeping it for backward compatibility but all new code should use AuthContext
import { create } from 'zustand';

interface UserState {
  user: {
    id: string;
    name: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar?: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  preferences: {
    darkMode: boolean;
    language: 'fr' | 'en';
    currency: string;
    notifications: boolean;
  };
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updatePreferences: (preferences: Partial<UserState['preferences']>) => void;
}

// Deprecated: Use AuthContext instead
export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  preferences: {
    darkMode: false,
    language: 'fr',
    currency: 'EUR',
    notifications: true,
  },
  
  login: async () => {
    console.warn('useUserStore is deprecated. Use AuthContext instead.');
  },
  
  signup: async () => {
    console.warn('useUserStore is deprecated. Use AuthContext instead.');
  },
  
  logout: () => {
    console.warn('useUserStore is deprecated. Use AuthContext instead.');
  },
  
  updatePreferences: () => {
    console.warn('useUserStore is deprecated. Use AuthContext instead.');
  },
}));