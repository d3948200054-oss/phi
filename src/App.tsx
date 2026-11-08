import React from 'react';
import { useTeachDeskStore } from './hooks/useTeachDeskStore';
import { AuthSurface } from './components/surfaces/AuthSurface';
import { AppShell } from './components/layout/AppShell';

export const AppContent: React.FC = () => {
  const { account } = useTeachDeskStore();

  if (!account) {
    return <AuthSurface />;
  }

  return <AppShell />;
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
