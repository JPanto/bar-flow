import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { syncService, SyncService } from '../src/services/syncService';
import { db } from '../src/db';

let mockAuthStateChangeCallback: ((event: string, session: any) => void) | null = null;
let mockCurrentSession: any = null;

const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();

vi.mock('../src/services/supabase', () => {
  return {
    isSupabaseConfigured: false,
    createFallbackClient: vi.fn(),
    supabase: {
      auth: {
        getSession: vi.fn(async () => ({
          data: { session: mockCurrentSession },
          error: null,
        })),
        onAuthStateChange: vi.fn((callback) => {
          mockAuthStateChangeCallback = callback;
          return {
            data: {
              subscription: {
                unsubscribe: vi.fn(),
              },
            },
          };
        }),
        signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
        signUp: (...args: any[]) => mockSignUp(...args),
        signOut: (...args: any[]) => mockSignOut(...args),
      },
    },
  };
});

import { AuthProvider } from '../src/context/AuthContext';
import { useAuth } from '../src/hooks/useAuth';

describe('Auth & SyncService Integration', () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
    mockCurrentSession = null;
    mockAuthStateChangeCallback = null;
    mockSignInWithPassword.mockReset();
    mockSignUp.mockReset();
    mockSignOut.mockReset();
    syncService.setAuthToken(null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('SyncService Token Handling', () => {
    it('manages auth token state correctly', () => {
      const service = new SyncService();
      expect(service.getAuthToken()).toBeNull();

      service.setAuthToken('test-token-xyz');
      expect(service.getAuthToken()).toBe('test-token-xyz');

      service.setAuthToken(null);
      expect(service.getAuthToken()).toBeNull();
    });

    it('attaches Authorization header in fetchInitialState when token is present', async () => {
      const service = new SyncService();
      service.setApiUrl('http://backend.test/api');
      service.setAuthToken('bearer-jwt-token-123');

      let capturedHeaders: any = null;
      global.fetch = vi.fn().mockImplementation(async (_url, options) => {
        capturedHeaders = options?.headers;
        return {
          ok: true,
          json: async () => ({ zones: [], tables: [], activeSessions: [], activeCalls: [] }),
        };
      });

      await service.fetchInitialState();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://backend.test/api/state/initial',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer bearer-jwt-token-123',
          },
        })
      );
      expect(capturedHeaders?.Authorization).toBe('Bearer bearer-jwt-token-123');
    });

    it('omits Authorization header in fetchInitialState when token is null', async () => {
      const service = new SyncService();
      service.setApiUrl('http://backend.test/api');
      service.setAuthToken(null);

      let capturedHeaders: any = null;
      global.fetch = vi.fn().mockImplementation(async (_url, options) => {
        capturedHeaders = options?.headers;
        return {
          ok: true,
          json: async () => ({ zones: [], tables: [], activeSessions: [], activeCalls: [] }),
        };
      });

      await service.fetchInitialState();

      expect(capturedHeaders?.Authorization).toBeUndefined();
    });

    it('attaches Authorization header in syncOutbox when token is present', async () => {
      const service = new SyncService();
      service.setApiUrl('http://backend.test/api');
      service.setAuthToken('sync-token-456');

      // Add a dummy pending event to sync_queue
      await db.sync_queue.put({
        id: 99991,
        entity: 'waiter_call',
        action: 'INSERT',
        entityId: 'call-99',
        payload: { id: 'call-99' },
        createdAt: Date.now(),
        status: 'pending',
      });

      let capturedHeaders: any = null;
      global.fetch = vi.fn().mockImplementation(async (_url, options) => {
        capturedHeaders = options?.headers;
        return {
          ok: true,
          json: async () => ({ success: true, syncedIds: ['99991'] }),
        };
      });

      await service.syncOutbox();

      expect(capturedHeaders?.Authorization).toBe('Bearer sync-token-456');
      expect(capturedHeaders?.['Content-Type']).toBe('application/json');

      // Cleanup
      await db.sync_queue.delete(99991);
    });
  });

  describe('Supabase Fallback Client', () => {
    it('creates a safe fallback client that handles auth operations without throwing', async () => {
      const { createFallbackClient } = await vi.importActual<
        typeof import('../src/services/supabase')
      >('../src/services/supabase');

      const fallback = createFallbackClient();
      expect(fallback).toBeDefined();
      expect(fallback.auth).toBeDefined();

      const sessionResult = await fallback.auth.getSession();
      expect(sessionResult.data.session).toBeNull();
      expect(sessionResult.error).toBeNull();

      const subResult = fallback.auth.onAuthStateChange(() => {});
      expect(subResult.data.subscription).toBeDefined();
      expect(typeof subResult.data.subscription.unsubscribe).toBe('function');
      expect(() => subResult.data.subscription.unsubscribe()).not.toThrow();

      const signInResult = await fallback.auth.signInWithPassword({
        email: 'test@bar.com',
        password: 'pass',
      });
      expect(signInResult.error).toBeInstanceOf(Error);

      const signUpResult = await fallback.auth.signUp({
        email: 'test@bar.com',
        password: 'pass',
      });
      expect(signUpResult.error).toBeInstanceOf(Error);

      const signOutResult = await fallback.auth.signOut();
      expect(signOutResult.error).toBeNull();
    });
  });

  describe('AuthContext and useAuth Hook', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(AuthProvider, null, children);

    it('throws error when useAuth is used outside AuthProvider', () => {
      // Temporarily silence console.error during expected throw
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderHook(() => useAuth())).toThrow(
        'useAuth must be used within an AuthProvider'
      );
      consoleSpy.mockRestore();
    });

    it('initializes with default guest state when no active session exists', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.role).toBe('guest');
      expect(result.current.tenantId).toBe('default');
      expect(syncService.getAuthToken()).toBeNull();
    });

    it('loads active manager session and synchronizes token with syncService', async () => {
      mockCurrentSession = {
        access_token: 'manager-jwt-abc',
        user: {
          id: 'user-manager-1',
          email: 'admin@bar-rooftop.com',
          user_metadata: {
            role: 'manager',
            tenant_id: 'tenant-rooftop',
          },
        },
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user?.id).toBe('user-manager-1');
      expect(result.current.session?.access_token).toBe('manager-jwt-abc');
      expect(result.current.role).toBe('manager');
      expect(result.current.tenantId).toBe('tenant-rooftop');
      expect(syncService.getAuthToken()).toBe('manager-jwt-abc');
    });

    it('updates state and syncService token on onAuthStateChange event', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.role).toBe('guest');

      // Trigger login via onAuthStateChange callback
      const staffSession = {
        access_token: 'staff-jwt-def',
        user: {
          id: 'user-staff-2',
          email: 'waiter@bar.com',
          user_metadata: {
            role: 'staff',
            tenant_id: 'tenant-centro',
          },
        },
      };

      act(() => {
        mockAuthStateChangeCallback?.('SIGNED_IN', staffSession);
      });

      expect(result.current.role).toBe('staff');
      expect(result.current.tenantId).toBe('tenant-centro');
      expect(result.current.user?.email).toBe('waiter@bar.com');
      expect(syncService.getAuthToken()).toBe('staff-jwt-def');

      // Trigger logout via onAuthStateChange callback
      act(() => {
        mockAuthStateChangeCallback?.('SIGNED_OUT', null);
      });

      expect(result.current.role).toBe('guest');
      expect(result.current.tenantId).toBe('default');
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(syncService.getAuthToken()).toBeNull();
    });

    it('invokes signIn and updates context upon success', async () => {
      const authenticatedSession = {
        access_token: 'signin-token-xyz',
        user: {
          id: 'user-signin',
          email: 'test@bar.com',
          user_metadata: {
            role: 'manager',
            tenant_id: 'tenant-signin',
          },
        },
      };

      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: authenticatedSession.user, session: authenticatedSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let res: any;
      await act(async () => {
        res = await result.current.signIn('test@bar.com', 'secret123');
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@bar.com',
        password: 'secret123',
      });
      expect(res.error).toBeNull();
      expect(result.current.role).toBe('manager');
      expect(result.current.tenantId).toBe('tenant-signin');
      expect(syncService.getAuthToken()).toBe('signin-token-xyz');
    });

    it('invokes signUp with metadata and updates context upon success', async () => {
      const newSession = {
        access_token: 'signup-token-123',
        user: {
          id: 'user-signup',
          email: 'new@bar.com',
          user_metadata: {
            name: 'New Owner',
            role: 'manager',
            tenant_id: 'tenant-new',
            tenantId: 'tenant-new',
          },
        },
      };

      mockSignUp.mockResolvedValueOnce({
        data: { user: newSession.user, session: newSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let res: any;
      await act(async () => {
        res = await result.current.signUp('new@bar.com', 'secret456', {
          name: 'New Owner',
          role: 'manager',
          tenantId: 'tenant-new',
        });
      });

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@bar.com',
        password: 'secret456',
        options: {
          data: {
            name: 'New Owner',
            role: 'manager',
            tenant_id: 'tenant-new',
            tenantId: 'tenant-new',
          },
        },
      });
      expect(res.error).toBeNull();
      expect(result.current.role).toBe('manager');
      expect(result.current.tenantId).toBe('tenant-new');
      expect(syncService.getAuthToken()).toBe('signup-token-123');
    });

    it('invokes signOut, resets state to guest, and clears token in syncService', async () => {
      mockCurrentSession = {
        access_token: 'active-session-token',
        user: {
          id: 'active-user',
          email: 'active@bar.com',
          user_metadata: { role: 'staff', tenant_id: 'tenant-active' },
        },
      };
      mockSignOut.mockResolvedValueOnce({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.role).toBe('staff');
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.role).toBe('guest');
      expect(result.current.tenantId).toBe('default');
      expect(syncService.getAuthToken()).toBeNull();
    });
  });
});
