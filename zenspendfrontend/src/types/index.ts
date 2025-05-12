export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
};

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense';
  accountId: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  currency: string;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  category: string;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: string;
  endDate: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  iconName?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface MonthlyExpense {
  month: string;
  expenses: number;
  income: number;
}

export type UserPreferences = {
  darkMode: boolean;
  language: 'fr' | 'en';
  currency: string;
  notifications: boolean;
};