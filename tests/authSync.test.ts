import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncService, SyncService } from '../src/services/syncService';
import { db } from '../src/db';

describe('Auth & SyncService Integration', () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
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
});
