import { describe, it, expect, beforeEach } from 'vitest';
import {
  BarMvpDB,
  createTable,
  startTableSession,
  closeTableSession,
  getActiveSessionForTable,
  createWaiterCall,
  attendingWaiterCall,
  resolveWaiterCall,
  cancelWaiterCall,
} from '../src/db';

describe('Table Sessions and Waiter Calls Lifecycle', () => {
  let db: BarMvpDB;

  beforeEach(async () => {
    db = new BarMvpDB(`test_sessions_db_${Date.now()}_${Math.random()}`);
    await db.open();
  });

  it('should start, retrieve, and close a table session with outbox events', async () => {
    const table = await createTable(db, {
      zoneId: 'zone-1',
      name: 'Mesa 4',
      shape: 'square',
      x: 100,
      y: 100,
      width: 90,
      height: 90,
      rotation: 0,
      seats: 4,
      status: 'occupied',
    });

    // Start session
    const session = await startTableSession(db, table.id, 'MOJITO-24');
    expect(session.id).toBeDefined();
    expect(session.tableId).toBe(table.id);
    expect(session.sessionWord).toBe('MOJITO-24');
    expect(session.status).toBe('active');

    // Retrieve active session
    const active = await getActiveSessionForTable(db, table.id);
    expect(active?.id).toBe(session.id);
    expect(active?.sessionWord).toBe('MOJITO-24');

    // Close session
    await closeTableSession(db, table.id);
    const afterClose = await getActiveSessionForTable(db, table.id);
    expect(afterClose).toBeUndefined();

    const storedSession = await db.table_sessions.get(session.id);
    expect(storedSession?.status).toBe('closed');
    expect(storedSession?.closedAt).toBeDefined();

    // Check outbox events logged
    const sessionEvents = await db.sync_queue.where({ entityId: session.id }).toArray();
    expect(sessionEvents.length).toBeGreaterThanOrEqual(2);
    expect(sessionEvents[0].action).toBe('INSERT');
    expect(sessionEvents[1].action).toBe('UPDATE');
  });

  it('should manage waiter call lifecycle: create, attend, and resolve', async () => {
    const call = await createWaiterCall(db, {
      tableId: 'table-1',
      sessionId: 'session-1',
      tableName: 'Mesa 1',
      sessionWord: 'BURGER-15',
      reason: 'bill',
    });

    expect(call.id).toBeDefined();
    expect(call.status).toBe('pending');
    expect(call.reason).toBe('bill');

    // Mark as attending ("En camino")
    await attendingWaiterCall(db, call.id);
    let updated = await db.waiter_calls.get(call.id);
    expect(updated?.status).toBe('attending');
    expect(updated?.attendingAt).toBeDefined();

    // Resolve call
    await resolveWaiterCall(db, call.id);
    updated = await db.waiter_calls.get(call.id);
    expect(updated?.status).toBe('resolved');
    expect(updated?.resolvedAt).toBeDefined();

    // Check sync events
    const callEvents = await db.sync_queue.where({ entityId: call.id }).toArray();
    expect(callEvents.length).toBe(3);
    expect(callEvents[0].action).toBe('INSERT');
    expect(callEvents[1].action).toBe('UPDATE');
    expect(callEvents[2].action).toBe('UPDATE');
  });

  it('should allow customer to cancel a pending call', async () => {
    const call = await createWaiterCall(db, {
      tableId: 'table-2',
      sessionId: 'session-2',
      tableName: 'Mesa 2',
      sessionWord: 'TEQUILA-09',
      reason: 'waiter',
    });

    await cancelWaiterCall(db, call.id);
    const updated = await db.waiter_calls.get(call.id);
    expect(updated?.status).toBe('cancelled');
  });
});
