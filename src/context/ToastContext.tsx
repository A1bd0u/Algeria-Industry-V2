import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

// Messages de retour intégrés à la page, à la place de window.alert() :
// ils ne bloquent pas l'interface et suivent la langue et le sens (RTL).

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

const DURATION_MS = 5000;

const STYLES: Record<ToastKind, { box: string; icon: React.ElementType }> = {
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: CheckCircle2 },
  error: { box: 'border-red-200 bg-red-50 text-red-900', icon: XCircle },
  info: { box: 'border-gray-200 bg-white text-primary', icon: Info },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    // Trois messages au plus à l'écran : les plus anciens disparaissent.
    setToasts((list) => [...list.slice(-2), { id, kind, message }]);
    window.setTimeout(() => dismiss(id), DURATION_MS);
  }, [dismiss]);

  const api = React.useMemo<ToastApi>(() => ({
    success: (message) => push('success', message),
    error: (message) => push('error', message),
    info: (message) => push('info', message),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-20 lg:bottom-6 inset-x-4 sm:inset-x-auto sm:end-6 z-[100] flex flex-col gap-3 sm:w-96 pointer-events-none">
        {toasts.map((toast) => {
          const { box, icon: Icon } = STYLES[toast.kind];
          return (
            <div
              key={toast.id}
              role={toast.kind === 'error' ? 'alert' : 'status'}
              className={cn('pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl', box)}
            >
              <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="shrink-0 opacity-60 hover:opacity-100"
                aria-label={t('common.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
