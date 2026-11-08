import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="border border-dashed border-border dark:border-border-dark rounded-lg p-8 sm:p-12 text-center flex flex-col items-center justify-center bg-surface-raised/40 dark:bg-surface-raised-dark/40">
      {icon && <div className="mb-3 text-content-secondary dark:text-content-secondary-dark">{icon}</div>}
      <h4 className="font-serif font-semibold text-base text-content-primary dark:text-content-primary-dark">
        {title}
      </h4>
      <p className="text-xs text-content-secondary dark:text-content-secondary-dark max-w-sm mt-1 mb-5">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
