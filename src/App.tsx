import React, { useState, useEffect } from 'react';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { AuthScreen } from './components/auth/AuthScreen';
import { StaffDashboard } from './components/dashboard/StaffDashboard';

const AppContent: React.FC = () => {
  const getInitialCustomerTableId = (): string | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('mesa');
  };

  const [customerTableId, setCustomerTableId] = useState<string | null>(getInitialCustomerTableId);
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setCustomerTableId(params.get('mesa'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleExitCustomerPortal = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('mesa');
    window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
    setCustomerTableId(null);
  };

  const handleSimulateCustomer = (tableId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('mesa', tableId);
    window.history.pushState({}, '', url.toString());
    setCustomerTableId(tableId);
  };

  // If customer mode is active (?mesa=:tableId), render Customer Portal directly (NO LOGIN)
  if (customerTableId) {
    return (
      <CustomerPortal
        tableId={customerTableId}
        onExitToStaff={handleExitCustomerPortal}
      />
    );
  }

  // Loading session
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-apple-bg text-apple-label-sec h-[100dvh] w-screen">
        <p className="animate-pulse text-xs tracking-wider uppercase font-medium">Cargando sesión...</p>
      </div>
    );
  }

  // If no authenticated user, render AuthScreen for staff/manager
  if (!user) {
    return <AuthScreen />;
  }

  // Authenticated staff/manager dashboard
  return <StaffDashboard onSimulateCustomer={handleSimulateCustomer} />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
