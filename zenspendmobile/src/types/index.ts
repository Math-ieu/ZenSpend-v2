// Shared domain types, ported from the web frontend (zenspendfrontend/src/types).
// Kept in sync manually since the two apps are not yet in a shared package.

export type UserSegment = 'couples' | 'young_professionals' | 'families';

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

export interface DebtTracker {
  id: number;
  name: string;
  total_amount: string;
  remaining_amount: string;
  interest_rate?: string;
  minimum_payment?: string;
  due_date?: string;
  debt_type?: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type?: string;
  is_read: boolean;
  created_at: string;
}

export interface MonthlyExpense {
  month: string;
  expenses: number;
  income: number;
}

export interface DashboardSummary {
  total_balance?: number;
  monthly_income?: number;
  monthly_expenses?: number;
  savings_rate?: number;
  [key: string]: any;
}

export interface AuthResponse {
  access: string;
  refresh?: string;
  user: User;
}
