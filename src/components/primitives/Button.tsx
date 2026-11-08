import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variants = {
    // Academic Crimson Primary
    primary: 'bg-[#e11d48] text-white hover:bg-[#be123c] active:bg-[#9f1239] border border-[#be123c] focus:ring-rose-400 shadow-none',
    // Titanium Slate Accent
    accent: 'bg-[#334155] text-white hover:bg-[#1e293b] active:bg-[#0f172a] border border-[#1e293b] focus:ring-slate-400 shadow-none',
    secondary: 'bg-white dark:bg-surface-dark text-content-primary dark:text-content-primary-dark border border-border dark:border-border-dark hover:bg-slate-50 dark:hover:bg-surface-raised-dark focus:ring-slate-400',
    outline: 'bg-transparent text-[#e11d48] dark:text-[#fb7185] border border-[#e11d48] dark:border-[#fb7185] hover:bg-rose-50 dark:hover:bg-rose-950/30 focus:ring-rose-400',
    danger: 'bg-rose-700 text-white hover:bg-rose-800 border border-rose-800 focus:ring-rose-500',
    ghost: 'bg-transparent text-content-secondary dark:text-content-secondary-dark hover:bg-slate-200/60 dark:hover:bg-slate-800/60 focus:ring-slate-400',
  };

  return (
    <button
      className={`${base} ${sizeStyles[size]} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
