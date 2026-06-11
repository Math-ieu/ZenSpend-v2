import { Account, Budget, Category, MonthlyExpense, SavingsGoal, Transaction, User } from '../types';
import { generateRandomAmount } from './utils';

export const currentUser: User = {
  id: 'user-1',
  first_name: 'Sophie',
  last_name : 'Martin',
  email: 'sophie.martin@example.com',
  phone_number: '',
  preferred_currency: 'EUR',
  avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=compress&cs=tinysrgb&w=100',
};

export const accounts: Account[] = [
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
];

export const categories: Category[] = [
  { id: 'cat-1', name: 'Alimentation', color: '#FF7F00', icon: 'Shopping' },
  { id: 'cat-2', name: 'Transport', color: '#0066FF', icon: 'Car' },
  { id: 'cat-3', name: 'Logement', color: '#8855FF', icon: 'Home' },
  { id: 'cat-4', name: 'Loisirs', color: '#33CC66', icon: 'Gamepad2' },
  { id: 'cat-5', name: 'Santé', color: '#FF3366', icon: 'Heart' },
  { id: 'cat-6', name: 'Shopping', color: '#FFCC00', icon: 'ShoppingBag' },
  { id: 'cat-7', name: 'Salaire', color: '#00CC99', icon: 'Wallet' },
  { id: 'cat-8', name: 'Cadeaux', color: '#FF6699', icon: 'Gift' },
];

export const transactions: Transaction[] = [
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
  {
    id: 'tx-4',
    date: '2025-03-24',
    amount: 35.00,
    description: 'Essence Total',
    category: 'Transport',
    type: 'expense',
    accountId: 'account-1',
  },
  {
    id: 'tx-5',
    date: '2025-03-22',
    amount: 850.00,
    description: 'Loyer Avril',
    category: 'Logement',
    type: 'expense',
    accountId: 'account-1',
  },
  {
    id: 'tx-6',
    date: '2025-03-20',
    amount: 125.30,
    description: 'Shopping Fnac',
    category: 'Shopping',
    type: 'expense',
    accountId: 'account-3',
  },
  {
    id: 'tx-7',
    date: '2025-03-18',
    amount: 22.50,
    description: 'Pharmacie',
    category: 'Santé',
    type: 'expense',
    accountId: 'account-1',
  },
  {
    id: 'tx-8',
    date: '2025-03-15',
    amount: 250.00,
    description: 'Virement épargne',
    category: 'Épargne',
    type: 'expense',
    accountId: 'account-1',
  },
];

export const budgets: Budget[] = [
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
  {
    id: 'budget-3',
    name: 'Loisirs',
    amount: 200,
    spent: 185.75,
    category: 'Loisirs',
    period: 'monthly',
    startDate: '2025-03-01',
    endDate: '2025-03-31',
  },
  {
    id: 'budget-4',
    name: 'Shopping',
    amount: 300,
    spent: 125.30,
    category: 'Shopping',
    period: 'monthly',
    startDate: '2025-03-01',
    endDate: '2025-03-31',
  },
];

export const savingsGoals: SavingsGoal[] = [
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
  {
    id: 'goal-3',
    name: 'Fonds d\'urgence',
    targetAmount: 5000,
    currentAmount: 2800,
    targetDate: '2025-12-31',
    iconName: 'Shield',
  },
];

export const monthlyExpenses: MonthlyExpense[] = [
  { month: 'Jan', expenses: generateRandomAmount(1000, 2000), income: generateRandomAmount(2500, 3500) },
  { month: 'Fév', expenses: generateRandomAmount(1000, 2000), income: generateRandomAmount(2500, 3500) },
  { month: 'Mar', expenses: generateRandomAmount(1000, 2000), income: generateRandomAmount(2500, 3500) },
  { month: 'Avr', expenses: generateRandomAmount(1000, 2000), income: generateRandomAmount(2500, 3500) },
  { month: 'Mai', expenses: generateRandomAmount(1000, 2000), income: generateRandomAmount(2500, 3500) },
  { month: 'Juin', expenses: generateRandomAmount(1000, 2000), income: generateRandomAmount(2500, 3500) },
];

export const generateCategories = () => {
  const categoryData = {
    labels: ['Alimentation', 'Transport', 'Logement', 'Loisirs', 'Santé', 'Shopping'],
    data: [25, 15, 35, 10, 5, 10],
    colors: ['#FF7F00', '#0066FF', '#8855FF', '#33CC66', '#FF3366', '#FFCC00'],
  };
  
  return categoryData;
};