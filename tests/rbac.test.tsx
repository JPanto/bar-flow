import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act, waitFor } from '@testing-library/react';
import { Navbar } from '../src/components/layout/Navbar';
import { AuthContext, AuthContextType, AuthProvider } from '../src/context/AuthContext';
import { useAuth } from '../src/hooks/useAuth';
import { CustomerPortal } from '../src/components/customer/CustomerPortal';
import { AuthScreen } from '../src/components/auth/AuthScreen';
import { StaffDashboard } from '../src/components/dashboard/StaffDashboard';

let mockAuthStateCallback: ((event: string, session: any) => void) | null = null;

// Mock child heavy components
vi.mock('../src/components/croquis/CroquisCanvas', () => ({
  CroquisCanvas: () => <div data-testid="mock-croquis-canvas" />,
}));
vi.mock('../src/components/croquis/ZoneTabs', () => ({
  ZoneTabs: () => <div data-testid="mock-zone-tabs" />,
}));
vi.mock('../src/components/croquis/EditorToolbar', () => ({
  EditorToolbar: () => <div data-testid="mock-editor-toolbar" />,
}));

vi.mock('../src/hooks/useTableManagement', () => ({
  useTableManagement: () => ({
    zones: [{ id: 'z-1', name: 'Principal', width: 800, height: 600 }],
    activeZone: { id: 'z-1', name: 'Principal', width: 800, height: 600 },
    setActiveZoneId: vi.fn(),
    allTables: [],
    zoneTables: [],
    selectedTableId: null,
    setSelectedTableId: vi.fn(),
    selectedTable: null,
    activeSessions: [],
    snapToGrid: true,
    setSnapToGrid: vi.fn(),
    handleAddTable: vi.fn(),
    handleUpdateTable: vi.fn(),
    handleDeleteSelected: vi.fn(),
    handleDeleteTable: vi.fn(),
    handleCreateZone: vi.fn(),
    handleUpdateTableStatus: vi.fn(),
    handleSeatReservation: vi.fn(),
    handleCompleteReservation: vi.fn(),
  }),
}));

vi.mock('../src/services/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn((cb) => {
        mockAuthStateCallback = cb;
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(async () => ({ error: null })),
    },
  },
}));

const createMockAuthContext = (overrides?: Partial<AuthContextType>): AuthContextType => ({
  user: { id: 'u-1', email: 'test@bar.com' } as any,
  session: { access_token: 'fake' } as any,
  role: 'manager',
  tenantId: 'tenant-test',
  isLoading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  continueAsDemo: vi.fn(),
  ...overrides,
});

describe('RBAC & Customer Security Controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStateCallback = null;
    window.sessionStorage.clear();
  });

  describe('Navbar RBAC', () => {
    it('renders "Editor Croquis" tab when user role is manager', () => {
      const mockAuth = createMockAuthContext({ role: 'manager' });
      render(
        <AuthContext.Provider value={mockAuth}>
          <Navbar
            currentTab="service"
            onSelectTab={vi.fn()}
            isOnline={true}
            pendingSyncCount={0}
            onOpenBackup={vi.fn()}
          />
        </AuthContext.Provider>
      );

      expect(screen.getByText('En Servicio')).toBeDefined();
      expect(screen.getByText('Editor Croquis')).toBeDefined();
      expect(screen.getByText('Reservas')).toBeDefined();
    });

    it('does NOT render "Editor Croquis" tab when user role is staff', () => {
      const mockAuth = createMockAuthContext({ role: 'staff' });
      render(
        <AuthContext.Provider value={mockAuth}>
          <Navbar
            currentTab="service"
            onSelectTab={vi.fn()}
            isOnline={true}
            pendingSyncCount={0}
            onOpenBackup={vi.fn()}
          />
        </AuthContext.Provider>
      );

      expect(screen.getByText('En Servicio')).toBeDefined();
      expect(screen.queryByText('Editor Croquis')).toBeNull();
      expect(screen.getByText('Reservas')).toBeDefined();
    });
  });

  describe('StaffDashboard Fallback RBAC', () => {
    it('prevents non-manager staff from accessing editor mode', async () => {
      const mockAuth = createMockAuthContext({ role: 'staff' });
      render(
        <AuthContext.Provider value={mockAuth}>
          <StaffDashboard onSimulateCustomer={vi.fn()} />
        </AuthContext.Provider>
      );

      // Verify that the editor toolbar is not rendered for staff
      expect(screen.queryByTestId('mock-editor-toolbar')).toBeNull();
      // Service stats bar should be active since currentTab defaulted to 'service'
      expect(screen.getByText('En Servicio')).toBeDefined();
    });
  });

  describe('CustomerPortal Scoping & Staff Exit', () => {
    it('provides clean exit button "Ir al Panel Principal"', () => {
      const onExit = vi.fn();
      render(<CustomerPortal tableId="non-existent-table" onExitToStaff={onExit} />);

      const exitBtn = screen.getByText('Ir al Panel Principal');
      expect(exitBtn).toBeDefined();

      fireEvent.click(exitBtn);
      expect(onExit).toHaveBeenCalledTimes(1);
    });
  });

  describe('AuthScreen Demo Roles & Confirmation', () => {
    it('renders both Demo Gestor and Demo Colaborador buttons', () => {
      const continueAsDemo = vi.fn();
      const mockAuth = createMockAuthContext({ continueAsDemo });

      render(
        <AuthContext.Provider value={mockAuth}>
          <AuthScreen />
        </AuthContext.Provider>
      );

      const gestorBtn = screen.getByText('Demo Gestor');
      const staffBtn = screen.getByText('Demo Colaborador');

      expect(gestorBtn).toBeDefined();
      expect(staffBtn).toBeDefined();

      fireEvent.click(gestorBtn);
      expect(continueAsDemo).toHaveBeenCalledWith('manager');

      fireEvent.click(staffBtn);
      expect(continueAsDemo).toHaveBeenCalledWith('staff');
    });

    it('displays email confirmation notice when signUp returns user without active session', async () => {
      const signUpMock = vi.fn().mockResolvedValue({
        data: {
          user: { id: 'pending-user', email: 'owner@bar.com' },
          session: null,
        },
        error: null,
      });

      const mockAuth = createMockAuthContext({ signUp: signUpMock });

      render(
        <AuthContext.Provider value={mockAuth}>
          <AuthScreen />
        </AuthContext.Provider>
      );

      // Switch to signup tab
      fireEvent.click(screen.getByText('Registrar Local'));

      // Fill in fields
      fireEvent.change(screen.getByPlaceholderText('Ej. Terraza Bar Central'), {
        target: { value: 'Terraza Bar' },
      });
      fireEvent.change(screen.getByPlaceholderText('tu@correo.com'), {
        target: { value: 'owner@bar.com' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Registrar Establecimiento'));

      await screen.findByText(
        '¡Registro completado! Por favor revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.'
      );
    });
  });

  describe('Demo Session Persistence in AuthContext', () => {
    it('preserves demo session when onAuthStateChange fires with null initial session', async () => {
      const demoSession = {
        access_token: 'demo-token-local',
        token_type: 'bearer',
        expires_in: 86400,
        refresh_token: 'demo-refresh-token',
        user: {
          id: 'demo-manager-1',
          app_metadata: { provider: 'demo' },
          user_metadata: {
            name: 'Gestor Demo',
            role: 'manager',
            tenant_id: 'tenant-demo',
          },
          email: 'gestor.demo@barflow.app',
        },
      };

      window.sessionStorage.setItem('barflow_demo_session', JSON.stringify(demoSession));

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(AuthProvider, null, children);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Emulate Supabase emitting empty session on init
      act(() => {
        mockAuthStateCallback?.('INITIAL_SESSION', null);
      });

      // Should still have demo session active
      expect(result.current.role).toBe('manager');
      expect(result.current.user?.email).toBe('gestor.demo@barflow.app');
      expect(result.current.tenantId).toBe('tenant-demo');
    });

    it('clears demo session on explicit signOut', async () => {
      const demoSession = {
        access_token: 'demo-token-local',
        token_type: 'bearer',
        expires_in: 86400,
        refresh_token: 'demo-refresh-token',
        user: {
          id: 'demo-staff-1',
          app_metadata: { provider: 'demo' },
          user_metadata: {
            name: 'Colaborador Demo',
            role: 'staff',
            tenant_id: 'tenant-demo',
          },
          email: 'staff.demo@barflow.app',
        },
      };

      window.sessionStorage.setItem('barflow_demo_session', JSON.stringify(demoSession));

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(AuthProvider, null, children);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.role).toBe('staff');
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(window.sessionStorage.getItem('barflow_demo_session')).toBeNull();
      expect(result.current.role).toBe('guest');
      expect(result.current.user).toBeNull();
    });
  });
});
