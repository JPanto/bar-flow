import { describe, it, expect, beforeEach } from 'vitest';
import { BarMvpDB, createTable, updateTableStatus, updateTablePosition, deleteTable, createReservation, updateReservationStatus, createZone } from '../src/db';
import { seedInitialData } from '../src/db/seed';

describe('Dexie Database & Outbox Pattern', () => {
  let db: BarMvpDB;

  beforeEach(async () => {
    // Unique DB name per test to prevent test contamination
    db = new BarMvpDB(`test_bar_db_${Date.now()}_${Math.random()}`);
    await db.open();
  });

  it('should seed initial demo data and populate sync queue', async () => {
    await seedInitialData(db);

    const zones = await db.zones.toArray();
    expect(zones.length).toBeGreaterThan(0);
    expect(zones[0].name).toBe('Salón Principal');

    const tables = await db.restaurantTables.toArray();
    expect(tables.length).toBe(6);

    const reservations = await db.reservations.toArray();
    expect(reservations.length).toBe(2);

    const syncEvents = await db.sync_queue.toArray();
    expect(syncEvents.length).toBeGreaterThan(0);
    expect(syncEvents.every(e => e.status === 'pending')).toBe(true);
  });

  it('should create a zone and log an INSERT sync event', async () => {
    const zone = await createZone(db, {
      name: 'Terraza Exterior',
      width: 1800,
      height: 1200,
      isDefault: false,
    });

    const storedZone = await db.zones.get(zone.id);
    expect(storedZone?.name).toBe('Terraza Exterior');

    const syncEvents = await db.sync_queue.where({ entityId: zone.id }).toArray();
    expect(syncEvents).toHaveLength(1);
    expect(syncEvents[0].action).toBe('INSERT');
    expect(syncEvents[0].entity).toBe('zone');
  });

  it('should create, update, and delete a table with outbox events', async () => {
    const table = await createTable(db, {
      zoneId: 'zone-1',
      name: 'Mesa 10',
      shape: 'round',
      x: 100,
      y: 150,
      width: 80,
      height: 80,
      rotation: 0,
      seats: 4,
      status: 'available',
    });

    expect(table.id).toBeDefined();

    // Check insert event
    let events = await db.sync_queue.where({ entityId: table.id }).toArray();
    expect(events).toHaveLength(1);
    expect(events[0].action).toBe('INSERT');

    // Update position
    await updateTablePosition(db, table.id, 120, 180, 45);
    const updatedPos = await db.restaurantTables.get(table.id);
    expect(updatedPos?.x).toBe(120);
    expect(updatedPos?.y).toBe(180);
    expect(updatedPos?.rotation).toBe(45);

    // Update status
    await updateTableStatus(db, table.id, 'occupied');
    const updatedStatus = await db.restaurantTables.get(table.id);
    expect(updatedStatus?.status).toBe('occupied');

    // Delete table
    await deleteTable(db, table.id);
    const deleted = await db.restaurantTables.get(table.id);
    expect(deleted).toBeUndefined();

    // Outbox should contain INSERT, 2x UPDATE, and 1x DELETE
    events = await db.sync_queue.where({ entityId: table.id }).toArray();
    expect(events).toHaveLength(4);
    expect(events[events.length - 1].action).toBe('DELETE');
  });

  it('should create reservation and update status with outbox events', async () => {
    const res = await createReservation(db, {
      tableId: 'table-1',
      customerName: 'Carlos Gómez',
      customerPhone: '+34 600 123 456',
      date: '2026-09-24',
      time: '21:00',
      pax: 4,
      notes: 'Aniversario',
      status: 'confirmed',
    });

    expect(res.id).toBeDefined();

    await updateReservationStatus(db, res.id, 'seated');
    const updated = await db.reservations.get(res.id);
    expect(updated?.status).toBe('seated');

    const events = await db.sync_queue.where({ entityId: res.id }).toArray();
    expect(events.length).toBe(2);
    expect(events[0].action).toBe('INSERT');
    expect(events[1].action).toBe('UPDATE');
  });
});
