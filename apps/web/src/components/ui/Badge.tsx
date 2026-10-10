import React from 'react';
import { clsx } from 'clsx';
import { EventCategory, EventStatus, RegistrationStatus } from '../../types/index.js';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'category' | 'status' | 'registration' | 'default';
  category?: EventCategory | string;
  status?: EventStatus | string;
  regStatus?: RegistrationStatus | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  category,
  status,
  regStatus,
  className,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  let colorClasses = 'bg-surface-muted dark:bg-surface-dark-muted text-ink-muted dark:text-ink-dark-muted border-border dark:border-border-dark';

  if (variant === 'category' || category) {
    const cat = (category || children)?.toString().toLowerCase();
    switch (cat) {
      case 'hackathons':
        colorClasses = 'bg-lavender/60 dark:bg-purple-950/60 text-lavender-dark dark:text-purple-300 border-lavender/80 dark:border-purple-800/60 font-medium';
        break;
      case 'workshops':
        colorClasses = 'bg-sky/60 dark:bg-sky-950/60 text-sky-dark dark:text-sky-300 border-sky/80 dark:border-sky-800/60 font-medium';
        break;
      case 'technology':
        colorClasses = 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800/60 font-medium';
        break;
      case 'cultural':
        colorClasses = 'bg-peach/60 dark:bg-orange-950/60 text-peach-dark dark:text-orange-300 border-peach/80 dark:border-orange-800/60 font-medium';
        break;
      case 'entrepreneurship':
        colorClasses = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 font-medium';
        break;
      case 'sports':
        colorClasses = 'bg-mint/60 dark:bg-emerald-950/60 text-mint-dark dark:text-emerald-300 border-mint/80 dark:border-emerald-800/60 font-medium';
        break;
      case 'talks':
        colorClasses = 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 font-medium';
        break;
      default:
        colorClasses = 'bg-surface-subtle dark:bg-surface-dark-subtle text-ink-light dark:text-ink-dark-muted border-border dark:border-border-dark';
    }
  } else if (variant === 'status' || status) {
    const s = (status || children)?.toString().toLowerCase();
    switch (s) {
      case 'published':
        colorClasses = 'bg-mint-light dark:bg-emerald-950/50 text-mint-dark dark:text-emerald-300 border-mint/60 dark:border-emerald-800/60 font-medium';
        break;
      case 'draft':
        colorClasses = 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
        break;
      case 'cancelled':
        colorClasses = 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/60 font-medium';
        break;
      case 'completed':
        colorClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        break;
    }
  } else if (variant === 'registration' || regStatus) {
    const r = (regStatus || children)?.toString().toLowerCase();
    switch (r) {
      case 'confirmed':
        colorClasses = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 font-semibold';
        break;
      case 'cancelled':
        colorClasses = 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
        break;
      case 'waitlist':
        colorClasses = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
        break;
    }
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border shadow-xs tracking-tight select-none',
        sizeClasses,
        colorClasses,
        className
      )}
    >
      {children}
    </span>
  );
};
