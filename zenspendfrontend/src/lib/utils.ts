import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
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