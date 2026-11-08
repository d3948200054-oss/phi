import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useTeachDeskStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 stroke-[1.75]" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 stroke-[1.75]" />,
          danger: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 stroke-[1.75]" />,
          info: <Info className="w-4 h-4 text-[#e11d48] dark:text-[#fb7185] shrink-0 stroke-[1.75]" />
        };

        const borders = {
          success: 'border-l-cyan-600 dark:border-l-cyan-400',
          warning: 'border-l-amber-600 dark:border-l-amber-400',
          danger: 'border-l-rose-600 dark:border-l-rose-400',
          info: 'border-l-[#e11d48] dark:border-l-rose-400'
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-white dark:bg-surface-dark border border-border dark:border-border-dark border-l-4 ${borders[toast.type]} rounded-md p-3.5 shadow-md flex items-start justify-between gap-3 animate-fade-in`}
          >
            <div className="flex items-start gap-2.5">
              {icons[toast.type]}
              <div>
                <p className="text-xs font-semibold text-content-primary dark:text-content-primary-dark">
                  {toast.title}
                </p>
                <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5 leading-relaxed">
                  {toast.message}
                </p>
                {toast.undoAction && (
                  <button
                    onClick={() => {
                      toast.undoAction?.();
                      dismissToast(toast.id);
                    }}
                    className="mt-1.5 text-xs font-semibold text-[#e11d48] dark:text-[#fb7185] hover:underline"
                  >
                    {toast.undoLabel || 'Undo action'}
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 rounded text-content-secondary hover:text-content-primary dark:hover:text-content-primary-dark hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
