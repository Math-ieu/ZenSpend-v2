import { create } from 'zustand';
import { currentUser } from '../lib/mockData';

interface UserState {
  user: {
    id: string;
    name: string;
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

// In a real app, we would use an API to fetch and update user data
export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  preferences: {
    darkMode: false,
    language: 'fr',
    currency: 'EUR',
    notifications: true,
  },
  
  login: async (email, password) => {
    // Simulate API call
    set({ isLoading: true });
    
    // In real app, we would make an API request here
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Mock successful login
        if (email && password) {
          set({ 
            user: currentUser,
            isAuthenticated: true,
            isLoading: false,
          });
          resolve();
        }
      }, 800);
    });
  },
  
  signup: async (name, email, password) => {
    // Simulate API call
    set({ isLoading: true });
    
    // In real app, we would make an API request here
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (name && email && password) {
          const newUser = {
            id: `user-${Date.now()}`,
            name,
            email,
            avatar: undefined
          };
          
          set({ 
            user: newUser,
            isAuthenticated: true,
            isLoading: false,
          });
          resolve();
        }
      }, 800);
    });
  },
  
  logout: () => {
    // In real app, clear tokens etc.
    set({ 
      user: null,
      isAuthenticated: false,
    });
  },
  
  updatePreferences: (newPreferences) => {
    set((state) => ({
      preferences: {
        ...state.preferences,
        ...newPreferences,
      }
    }));
  },
}));

// Initialize the store
setTimeout(() => {
  // Simulating checking for existing session
  useUserStore.setState({
    isLoading: false,
    // For demo purposes, uncomment to auto-login
    // user: currentUser,
    // isAuthenticated: true,
  });
}, 1000);