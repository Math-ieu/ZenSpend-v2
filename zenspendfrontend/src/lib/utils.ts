import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Global reactive bridge object for active currency and exchange rates
export const globalCurrencyState = {
  currency: 'EUR',
  rates: {
    EUR: 1.0,
    USD: 1.09,
    GBP: 0.84,
    CAD: 1.48,
    JPY: 170.8,
    CHF: 0.98,
  } as Record<string, number>,
  setCurrency(cur: string) {
    this.currency = cur;
  },
  setRates(newRates: Record<string, number>) {
    this.rates = newRates;
  }
};

export function formatCurrency(amount: number, currencyOverride?: string) {
  const activeCurrency = currencyOverride || globalCurrencyState.currency || 'EUR';
  const numAmount = Number(amount || 0);

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: activeCurrency,
  }).format(numAmount);
}

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  const rates = globalCurrencyState.rates;
  const numAmount = Number(amount || 0);
  const amountInEUR = numAmount / (rates[fromCurrency] || rates['EUR'] || 1.0);
  return amountInEUR * (rates[toCurrency] || rates['EUR'] || 1.0);
}


export function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function calculateProgress(current: number, target: number) {
  return Math.min(Math.max((current / target) * 100, 0), 100);
}

export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function generateRandomAmount(min = 10, max = 1000) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function createColorShade(percentage: number): string {
  // Convert percentage to color - green at 100%, yellow at 50%, red at 0%
  if (percentage >= 80) return 'bg-success';
  if (percentage >= 50) return 'bg-warning';
  return 'bg-error';
}