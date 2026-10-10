import React from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'subtle' | 'danger' | 'mint';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  to?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  to,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 font-medium rounded-lg',
    md: 'px-4 py-2.5 text-sm gap-2 font-medium',
    lg: 'px-6 py-3.5 text-base gap-2.5 font-semibold rounded-2xl',
  };

  const variantStyles = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md focus:ring-brand-500 border border-brand-700/20 dark:border-brand-500/30',
    secondary: 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-muted border border-border dark:border-border-dark shadow-card dark:shadow-card-dark hover:border-border-darker dark:hover:border-border-dark focus:ring-brand-500',
    subtle: 'bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60 border border-brand-200/60 dark:border-brand-800/60 focus:ring-brand-500',
    outline: 'border border-border dark:border-border-dark text-ink dark:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-muted hover:border-border-darker dark:hover:border-border-dark focus:ring-brand-500',
    danger: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60 hover:bg-red-100 dark:hover:bg-red-900/60 hover:border-red-300 focus:ring-red-500',
    mint: 'bg-mint-dark text-white hover:bg-emerald-700 shadow-sm focus:ring-emerald-500 border border-emerald-800/20',
  };

  if (to) {
    return (
      <Link
        to={to}
        className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        onClick={props.onClick as any}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </Link>
    );
  }

  return (
    <button
      className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};
