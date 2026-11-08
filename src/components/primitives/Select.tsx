import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  microLabel?: boolean;
  options?: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helper, microLabel = true, options, children, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1 w-full text-left">
        {label && (
          <label
            htmlFor={selectId}
            className={
              microLabel
                ? 'text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark'
                : 'text-xs font-medium text-content-primary dark:text-content-primary-dark'
            }
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full px-3 py-1.5 text-sm rounded-md bg-white dark:bg-surface-dark border ${
            error
              ? 'border-rose-500 focus:ring-rose-500'
              : 'border-border dark:border-border-dark focus:border-[#e11d48] dark:focus:border-[#fb7185]'
          } text-content-primary dark:text-content-primary-dark focus:outline-none focus:ring-1 focus:ring-rose-400 disabled:opacity-50 transition-colors ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        {error && <span className="text-xs text-rose-600 dark:text-rose-400">{error}</span>}
        {helper && !error && (
          <span className="text-xs text-content-secondary dark:text-content-secondary-dark">{helper}</span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
