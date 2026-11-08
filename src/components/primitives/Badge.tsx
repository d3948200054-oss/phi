import React from 'react';

export type BadgeVariant = 'amber' | 'teal' | 'rose' | 'sky' | 'slate' | 'crimson' | 'indigo';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  showDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'slate',
  children,
  showDot = true,
  className = ''
}) => {
  const styles = {
    crimson: {
      bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-900',
      dot: 'bg-[#e11d48] dark:bg-[#fb7185]'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-600 dark:bg-amber-400'
    },
    teal: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-600 dark:bg-emerald-400'
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800',
      dot: 'bg-[#e11d48] dark:bg-[#fb7185]'
    },
    sky: {
      bg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-800',
      dot: 'bg-sky-600 dark:bg-sky-400'
    },
    slate: {
      bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-500 dark:bg-slate-400'
    },
    indigo: {
      bg: 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-700',
      dot: 'bg-[#334155] dark:bg-[#94a3b8]'
    }
  };

  const current = styles[variant] || styles.slate;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${current.bg} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${current.dot} shrink-0`} />}
      <span>{children}</span>
    </span>
  );
};
