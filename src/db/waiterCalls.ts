import type { BarMvpDB } from './index';
import { logSyncEvent } from './index';
import type {
  TableSession,
  WaiterCall,
  CallReason,
  CallStatus,
} from '../types/database';

// Table Session operations
export async function startTableSession(
  database: BarMvpDB,
  tableId: string,
  sessionWord: string
): Promise<TableSession> {
  const session: TableSession = {
    id: crypto.randomUUID(),
    tableId,
    sessionWord,
    status: 'active',
    openedAt: Date.now(),
    closedAt: null,
  };

  await database.transaction(
    'rw',
    database.table_sessions,
    database.sync_queue,
    async () => {
      // Close any previous active session for this table
      const previousActive = await database.table_sessions
        .where({ tableId, status: 'active' })
        .toArray();

      for (const prev of previousActive) {
        await database.table_sessions.update(prev.id, {
          status: 'closed',
          closedAt: Date.now(),
        });
        await logSyncEvent(database, 'table_session', 'UPDATE', prev.id, {
          status: 'closed',
          closedAt: Date.now(),
        });
      }

      await database.table_sessions.add(session);
      await logSyncEvent(database, 'table_session', 'INSERT', session.id, session);
    }
  );

  return session;
}

export async function getActiveSessionForTable(
  database: BarMvpDB,
  tableId: string
): Promise<TableSession | undefined> {
  return await database.table_sessions
    .where({ tableId, status: 'active' })
    .first();
}

export async function closeTableSession(
  database: BarMvpDB,
  tableId: string
): Promise<void> {
  await database.transaction(
    'rw',
    database.table_sessions,
    database.sync_queue,
    async () => {
      const activeSessions = await database.table_sessions
        .where({ tableId, status: 'active' })
        .toArray();

      for (const session of activeSessions) {
        const changes = { status: 'closed' as const, closedAt: Date.now() };
        await database.table_sessions.update(session.id, changes);
        await logSyncEvent(database, 'table_session', 'UPDATE', session.id, changes);
      }
    }
  );
}

// Waiter Call operations
export async function createWaiterCall(
  database: BarMvpDB,
  data: {
    tableId: string;
    sessionId: string;
    tableName: string;
    sessionWord: string;
    reason: CallReason;
  }
): Promise<WaiterCall> {
  const call: WaiterCall = {
    id: crypto.randomUUID(),
    tableId: data.tableId,
    sessionId: data.sessionId,
    tableName: data.tableName,
    sessionWord: data.sessionWord,
    reason: data.reason,
    status: 'pending',
    createdAt: Date.now(),
    attendingAt: null,
    resolvedAt: null,
  };

  await database.transaction(
    'rw',
    database.waiter_calls,
    database.sync_queue,
    async () => {
      await database.waiter_calls.add(call);
      await logSyncEvent(database, 'waiter_call', 'INSERT', call.id, call);
    }
  );

  return call;
}

export async function attendingWaiterCall(
  database: BarMvpDB,
  callId: string
): Promise<void> {
  await database.transaction(
    'rw',
    database.waiter_calls,
    database.sync_queue,
    async () => {
      const changes = {
        status: 'attending' as CallStatus,
        attendingAt: Date.now(),
      };
      await database.waiter_calls.update(callId, changes);
      await logSyncEvent(database, 'waiter_call', 'UPDATE', callId, changes);
    }
  );
}

export async function resolveWaiterCall(
  database: BarMvpDB,
  callId: string
): Promise<void> {
  await database.transaction(
    'rw',
    database.waiter_calls,
    database.sync_queue,
    async () => {
      const changes = {
        status: 'resolved' as CallStatus,
        resolvedAt: Date.now(),
      };
      await database.waiter_calls.update(callId, changes);
      await logSyncEvent(database, 'waiter_call', 'UPDATE', callId, changes);
    }
  );
}

export async function cancelWaiterCall(
  database: BarMvpDB,
  callId: string
): Promise<void> {
  await database.transaction(
    'rw',
    database.waiter_calls,
    database.sync_queue,
    async () => {
      const changes = { status: 'cancelled' as CallStatus };
      await database.waiter_calls.update(callId, changes);
      await logSyncEvent(database, 'waiter_call', 'UPDATE', callId, changes);
    }
  );
}
