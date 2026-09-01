import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { BookingStatus, MechanicStatus, ServiceCategory } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  PENDING: {
    label: 'Pending',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    dot: 'bg-amber-500',
  },
  ASSIGNED: {
    label: 'Assigned',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    dot: 'bg-blue-500',
  },
  ON_THE_WAY: {
    label: 'On The Way',
    color: 'text-violet-700 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    dot: 'bg-violet-500',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'text-indigo-700 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    dot: 'bg-indigo-500',
  },
  COMPLETED: {
    label: 'Completed',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    dot: 'bg-emerald-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    dot: 'bg-rose-500',
  },
};

export const MECHANIC_STATUS_CONFIG: Record<
  MechanicStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  AVAILABLE: {
    label: 'Available',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    dot: 'bg-emerald-500',
  },
  BUSY: {
    label: 'Busy',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    dot: 'bg-amber-500',
  },
  OFF_DUTY: {
    label: 'Off Duty',
    color: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800/40',
    dot: 'bg-slate-400',
  },
};

export const SERVICE_LABELS: Record<ServiceCategory, string> = {
  OIL_CHANGE: 'Oil Change',
  BRAKE_SERVICE: 'Brake Service',
  TYRE_SERVICE: 'Tyre Service',
  BATTERY_SERVICE: 'Battery Service',
  ENGINE_DIAGNOSTIC: 'Engine Diagnostic',
  AC_SERVICE: 'AC Service',
  FULL_SERVICE: 'Full Service',
  ELECTRICAL: 'Electrical',
  SUSPENSION: 'Suspension',
  TRANSMISSION: 'Transmission',
  DETAILING: 'Detailing',
  ROADSIDE_ASSISTANCE: 'Roadside Assistance',
};

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
