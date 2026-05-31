export type User = {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  preferred_currency: string;
  user_segment?: UserSegment;
  avatar?: string;
};

export type UserSegment = 'couples' | 'young_professionals' | 'families';

export type HouseholdRole = 'owner' | 'parent' | 'partner' | 'child';

export interface Household {
  id: number;
  name: string;
  description: string;
  owner: number;
  owner_email: string;
  currency: string;
  members_count: number;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMember {
  id: number;
  user: number;
  user_email: string;
  user_full_name: string;
  role: HouseholdRole;
  is_active: boolean;
  joined_at: string;
}

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
  current_amount?: number;
  category: string;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: string;
  endDate: string;
}

export interface SharedBudget {
  id: number;
  name: string;
  owner: number;
  household: number;
  household_name?: string;
  members: number[];
  amount: string;
  current_amount: string;
  start_date: string;
  end_date?: string | null;
  categories: number[];
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