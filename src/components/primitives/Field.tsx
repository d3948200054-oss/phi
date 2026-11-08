import React from 'react';

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  microLabel?: boolean;
}

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, helper, microLabel = true, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1 w-full text-left">
        {label && (
          <label
            htmlFor={inputId}
            className={
              microLabel
                ? 'text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark'
                : 'text-xs font-medium text-content-primary dark:text-content-primary-dark'
            }
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full px-3 py-1.5 text-sm rounded-md bg-white dark:bg-surface-dark border ${
            error
              ? 'border-rose-500 focus:ring-rose-500'
              : 'border-border dark:border-border-dark focus:border-[#e11d48] dark:focus:border-[#fb7185]'
          } text-content-primary dark:text-content-primary-dark placeholder:text-content-secondary/60 focus:outline-none focus:ring-1 focus:ring-rose-400 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 transition-colors ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>}
        {helper && !error && (
          <span className="text-xs text-content-secondary dark:text-content-secondary-dark">{helper}</span>
        )}
      </div>
    );
  }
);

Field.displayName = 'Field';
