import React from 'react';

interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  activeBorder?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  badge,
  actions,
  activeBorder = false,
  padding = 'md',
  className = '',
  children,
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6',
  };

  return (
    <div
      className={`bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg transition-colors ${
        activeBorder
          ? 'border-l-[3px] border-l-[#e11d48] dark:border-l-[#fb7185] bg-rose-50/20 dark:bg-rose-950/10'
          : ''
      } ${className}`}
      {...props}
    >
      {(title || actions || subtitle || badge) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-border dark:border-border-dark">
          <div>
            <div className="flex items-center gap-2.5">
              {title && (
                <h3 className="font-serif font-semibold text-base sm:text-lg text-content-primary dark:text-content-primary-dark tracking-tight">
                  {title}
                </h3>
              )}
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-content-secondary dark:text-content-secondary-dark mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  );
};
