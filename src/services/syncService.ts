import { db } from '../db';

export class SyncService {
  private apiUrl: string | undefined;
  private authToken: string | null = null;
  private syncInterval: any = null;
  private isSyncing = false;

  constructor() {
    this.apiUrl =
      typeof import.meta !== 'undefined'
        ? (import.meta as any).env?.VITE_API_URL
        : undefined;
  }

  public setApiUrl(url: string) {
    this.apiUrl = url;
  }

  public getApiUrl(): string | undefined {
    return this.apiUrl;
  }

  public setAuthToken(token: string | null) {
    this.authToken = token;
  }

  public getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Pulls authoritative state from PostgreSQL backend on startup/reconnect
   */
  public async fetchInitialState(): Promise<void> {
    if (!this.apiUrl || typeof window === 'undefined' || !navigator.onLine) {
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const res = await fetch(`${this.apiUrl}/state/initial`, { headers });
      if (!res.ok) return;

      const data = await res.json();
      const { zones, tables, activeSessions, activeCalls } = data;

      // If backend has data, hydrate local Dexie
      if (zones && zones.length > 0) {
        await db.zones.bulkPut(zones);
      }
      if (tables && tables.length > 0) {
        await db.restaurantTables.bulkPut(tables);
      }
      if (activeSessions && activeSessions.length > 0) {
        await db.table_sessions.bulkPut(activeSessions);
      }
      if (activeCalls && activeCalls.length > 0) {
        await db.waiter_calls.bulkPut(activeCalls);
      }

      // If backend was completely empty but we have local seeded data, trigger outbox push
      const localTablesCount = await db.restaurantTables.count();
      if ((!tables || tables.length === 0) && localTablesCount > 0) {
        await this.syncOutbox();
      }
    } catch (err) {
      console.warn('Could not fetch initial state from backend:', err);
    }
  }

  /**
   * Pushes pending outbox events from Dexie sync_queue to POST /api/sync
   */
  public async syncOutbox(): Promise<void> {
    if (!this.apiUrl || this.isSyncing || typeof window === 'undefined' || !navigator.onLine) {
      return;
    }

    try {
      this.isSyncing = true;
      const pendingEvents = await db.sync_queue
        .where({ status: 'pending' })
        .toArray();

      if (pendingEvents.length === 0) {
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.apiUrl}/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          events: pendingEvents.map((e) => ({
            id: String(e.id),
            entity: e.entity,
            action: e.action,
            entityId: e.entityId,
            payload: e.payload,
            createdAt: e.createdAt,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed with HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.syncedIds)) {
        const numericIds = result.syncedIds.map(Number).filter((n: number) => !isNaN(n));
        for (const id of numericIds) {
          await db.sync_queue.update(id, { status: 'synced' });
        }
      }
    } catch (err) {
      console.warn('Sync outbox attempt failed:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  public triggerSync() {
    setTimeout(() => {
      this.syncOutbox();
    }, 100);
  }

  public start() {
    this.fetchInitialState();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.fetchInitialState();
        this.syncOutbox();
      });

      // Periodic sync loop every 10 seconds
      this.syncInterval = setInterval(() => {
        this.syncOutbox();
      }, 10000);
    }
  }

  public stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

export const syncService = new SyncService();
