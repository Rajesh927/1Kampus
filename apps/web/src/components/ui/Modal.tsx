import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 dark:bg-black/80 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Positioning wrapper: min-h-full ensures proper centering without clipping the top */}
      <div className="min-h-full flex items-center justify-center p-3 sm:p-6 text-left pointer-events-none">
        {/* Modal Dialog Card */}
        <div
          className={`relative w-full ${maxWidthClasses} max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] flex flex-col bg-surface dark:bg-surface-dark rounded-3xl shadow-modal border border-border/80 dark:border-border-dark z-10 transition-all duration-300 animate-slide-up pointer-events-auto my-auto overflow-hidden`}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          {(title || description) ? (
            <div className="flex items-start justify-between gap-4 p-5 sm:p-7 pb-4 border-b border-border/60 dark:border-border-dark/60 shrink-0 bg-surface dark:bg-surface-dark">
              <div>
                {title && <h3 className="font-display font-bold text-xl text-ink dark:text-ink-dark tracking-tight">{title}</h3>}
                {description && <p className="text-sm text-ink-muted dark:text-ink-dark-muted mt-1 leading-relaxed">{description}</p>}
              </div>
              <button
                onClick={onClose}
                type="button"
                className="p-1.5 text-ink-faint dark:text-ink-dark-faint hover:text-ink dark:hover:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-muted rounded-xl transition-colors cursor-pointer shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex justify-end p-4 pb-0 shrink-0 bg-surface dark:bg-surface-dark">
              <button
                onClick={onClose}
                type="button"
                className="p-1.5 text-ink-faint dark:text-ink-dark-faint hover:text-ink dark:hover:text-ink-dark hover:bg-surface-subtle dark:hover:bg-surface-dark-muted rounded-xl transition-colors cursor-pointer shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Scrollable Modal Content */}
          <div className="p-5 sm:p-7 overflow-y-auto flex-1 overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
