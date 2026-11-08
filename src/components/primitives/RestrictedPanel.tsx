import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from './Button';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';

interface RestrictedPanelProps {
  requiredRole?: string;
  surfaceName?: string;
}

export const RestrictedPanel: React.FC<RestrictedPanelProps> = ({
  requiredRole = 'admin',
  surfaceName = 'this administration surface',
}) => {
  const { role, setActiveTab } = useTeachDeskStore();

  return (
    <div className="border border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 rounded-lg p-8 sm:p-12 text-center flex flex-col items-center justify-center my-6">
      <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
        <ShieldAlert size={24} className="stroke-[1.75]" />
      </div>
      <h3 className="font-serif font-semibold text-lg text-rose-950 dark:text-rose-200">
        Access Restricted by Policy
      </h3>
      <p className="text-xs text-content-secondary dark:text-content-secondary-dark max-w-md mt-1 mb-6 leading-relaxed">
        Your signed-in account is provisioned under the role <strong className="font-mono text-content-primary dark:text-content-primary-dark uppercase">[{role || 'none'}]</strong>.
        Viewing {surfaceName} requires <strong className="font-mono uppercase">[{requiredRole}]</strong> credentials. In adherence to rule #1, roles are strictly account-bound and cannot be spoofed or switched in the UI.
      </p>
      <Button variant="secondary" size="sm" onClick={() => setActiveTab('dashboard')}>
        Return to Dashboard
      </Button>
    </div>
  );
};
