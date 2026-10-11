import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (options: { title: string; message?: string; type?: ToastType; duration?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback(({ title, message, type = 'info', duration = 4000 }: {
    title: string;
    message?: string;
    type?: ToastType;
    duration?: number;
  }) => {
    setToasts(prev => {
      // Prevent duplicate toast spam if exact same title and message are already showing
      if (prev.some(t => t.title === title && t.message === message)) {
        return prev;
      }

      const id = Math.random().toString(36).substring(2, 9);
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      // Cap to at most 3 simultaneous toasts to prevent screen crowding
      const updated = [...prev, { id, title, message, type }];
      return updated.slice(-3);
    });
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => toast({ title, message, type: 'success' }), [toast]);
  const error = useCallback((title: string, message?: string) => toast({ title, message, type: 'error' }), [toast]);
  const info = useCallback((title: string, message?: string) => toast({ title, message, type: 'info' }), [toast]);
  const warning = useCallback((title: string, message?: string) => toast({ title, message, type: 'warning' }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      {/* Toast floating container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-float dark:shadow-float-dark border transition-all duration-300 animate-slide-up bg-surface dark:bg-surface-dark ${
              t.type === 'success' ? 'border-mint-dark/30 dark:border-emerald-500/30 bg-mint-light/40 dark:bg-emerald-950/70 text-ink dark:text-ink-dark' :
              t.type === 'error' ? 'border-red-300 dark:border-red-800/60 bg-red-50/90 dark:bg-red-950/70 text-red-950 dark:text-red-200' :
              t.type === 'warning' ? 'border-peach-dark/30 dark:border-amber-800/60 bg-peach-light dark:bg-amber-950/70 text-ink dark:text-ink-dark' :
              'border-sky-dark/30 dark:border-sky-800/60 bg-sky-light dark:bg-sky-950/70 text-ink dark:text-ink-dark'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-mint-dark dark:text-emerald-400" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
              {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-peach-dark dark:text-amber-400" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-sky-dark dark:text-sky-400" />}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm leading-tight">{t.title}</h4>
              {t.message && <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-1 leading-relaxed">{t.message}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 p-1 text-ink-faint dark:text-ink-dark-faint hover:text-ink dark:hover:text-ink-dark transition-colors rounded-lg cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
