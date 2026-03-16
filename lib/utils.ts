import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, isPast } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null, fmt = 'dd MMM yyyy'): string {
  if (!date) return '—'
  return format(new Date(date), fmt)
}

export function getDateLabel(date: Date | null): string {
  if (!date) return 'Date Awaited'
  if (isToday(new Date(date))) return 'Today'
  if (isTomorrow(new Date(date))) return 'Tomorrow'
  if (isPast(new Date(date))) return 'Overdue'
  return formatDate(date)
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.substring(0, n - 1) + '…' : str
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}
