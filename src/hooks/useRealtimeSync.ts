import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { seedInitialData } from '../db/seed';
import { realtimeService } from '../services/realtime';
import { syncService } from '../services/syncService';
import { playServiceChime } from '../utils/soundAlert';

export interface UseRealtimeSyncReturn {
  isOnline: boolean;
  pendingSyncCount: number;
}

/**
 * Hook to manage offline/online status, Dexie initial seeding,
 * background outbox sync, and incoming real-time WebSocket event ingestion.
 */
export function useRealtimeSync(): UseRealtimeSyncReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const pendingSyncCount =
    useLiveQuery(() => db.sync_queue.where({ status: 'pending' }).count()) || 0;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial local seed and start outbox synchronization loop
    seedInitialData(db);
    syncService.start();

    // Ingest incoming real-time events into local IndexedDB
    const unsubscribeRealtime = realtimeService.subscribe(async (event) => {
      try {
        switch (event.type) {
          case 'CALL_CREATED': {
            const call = (event.payload as any)?.call || event.payload;
            if (call && call.id) {
              await db.waiter_calls.put(call);
              playServiceChime();
            }
            break;
          }
          case 'CALL_ATTENDING': {
            const { callId, attendingAt } = (event.payload as any) || {};
            if (callId) {
              await db.waiter_calls.update(callId, {
                status: 'attending',
                attendingAt: attendingAt || Date.now(),
              });
            }
            break;
          }
          case 'CALL_RESOLVED': {
            const { callId, resolvedAt } = (event.payload as any) || {};
            if (callId) {
              await db.waiter_calls.update(callId, {
                status: 'resolved',
                resolvedAt: resolvedAt || Date.now(),
              });
            }
            break;
          }
          case 'CALL_CANCELLED': {
            const { callId } = (event.payload as any) || {};
            if (callId) {
              await db.waiter_calls.update(callId, {
                status: 'cancelled',
              });
            }
            break;
          }
          case 'SESSION_STARTED': {
            const session = (event.payload as any)?.session || event.payload;
            if (session && session.id) {
              await db.table_sessions.put(session);
            }
            break;
          }
          case 'SESSION_CLOSED': {
            const { tableId } = (event.payload as any) || {};
            if (tableId) {
              await db.table_sessions
                .where({ tableId, status: 'active' })
                .modify({ status: 'closed', closedAt: Date.now() });
            }
            break;
          }
          case 'TABLE_UPDATED': {
            const table = (event.payload as any)?.table || event.payload;
            if (table && table.id) {
              await db.restaurantTables.put(table);
            }
            break;
          }
          case 'TABLE_DELETED': {
            const { id } = (event.payload as any) || {};
            if (id) {
              await db.restaurantTables.delete(id);
            }
            break;
          }
          case 'ZONE_CREATED':
          case 'ZONE_UPDATED': {
            const zone = (event.payload as any)?.zone || event.payload;
            if (zone && zone.id) {
              await db.zones.put(zone);
            }
            break;
          }
          default:
            break;
        }
      } catch (err) {
        console.error('Error synchronizing incoming realtime event into Dexie:', err);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeRealtime();
      syncService.stop();
    };
  }, []);

  return {
    isOnline,
    pendingSyncCount,
  };
}
