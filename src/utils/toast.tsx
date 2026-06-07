import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';
interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={[
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur',
              'animate-[slide-in_0.2s_ease-out]',
              t.variant === 'success'
                ? 'border-emerald-200 bg-white/95 text-emerald-900 dark:border-emerald-700/50 dark:bg-emerald-900/80 dark:text-emerald-50'
                : t.variant === 'error'
                ? 'border-rose-200 bg-white/95 text-rose-900 dark:border-rose-700/50 dark:bg-rose-900/80 dark:text-rose-50'
                : 'border-surface-200 bg-white/95 text-surface-900 dark:border-surface-700 dark:bg-surface-800/95 dark:text-surface-50',
            ].join(' ')}
          >
            {t.variant === 'success' ? (
              <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
            ) : t.variant === 'error' ? (
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            ) : (
              <Info size={18} className="mt-0.5 flex-shrink-0" />
            )}
            <span className="flex-1 text-sm font-medium">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Defensive fallback so utility calls outside provider don't crash.
    return { show: () => {} };
  }
  return ctx;
}
