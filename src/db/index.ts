import Dexie, { type Table } from 'dexie';
import {
  Zone,
  TableElement,
  Reservation,
  Customer,
  SyncEvent,
  SyncEntity,
  SyncAction,
  TableStatus,
  ReservationStatus,
} from '../types/database';

export class BarMvpDB extends Dexie {
  zones!: Table<Zone, string>;
  restaurantTables!: Table<TableElement, string>;
  reservations!: Table<Reservation, string>;
  customers!: Table<Customer, string>;
  sync_queue!: Table<SyncEvent, number>;

  constructor(dbName = 'BarRestoFlowDB') {
    super(dbName);

    this.version(1).stores({
      zones: 'id, name, isDefault, createdAt',
      restaurantTables: 'id, zoneId, name, shape, status, seats, updatedAt',
      reservations: 'id, tableId, date, time, status, customerName, createdAt',
      customers: 'id, name, phone, email, createdAt',
      sync_queue: '++id, entity, action, entityId, status, createdAt',
    });
  }
}

// Global singleton instance for app runtime
export const db = new BarMvpDB();

// Helper to log outbox events
export async function logSyncEvent(
  database: BarMvpDB,
  entity: SyncEntity,
  action: SyncAction,
  entityId: string,
  payload: any
): Promise<number> {
  return await database.sync_queue.add({
    entity,
    action,
    entityId,
    payload,
    createdAt: Date.now(),
    status: 'pending',
  });
}

// Zone operations
export async function createZone(
  database: BarMvpDB,
  data: Omit<Zone, 'id' | 'createdAt'> & { id?: string }
): Promise<Zone> {
  const zone: Zone = {
    id: data.id || crypto.randomUUID(),
    name: data.name,
    width: data.width || 2000,
    height: data.height || 1500,
    isDefault: data.isDefault ?? false,
    createdAt: Date.now(),
  };

  await database.transaction('rw', database.zones, database.sync_queue, async () => {
    await database.zones.add(zone);
    await logSyncEvent(database, 'zone', 'INSERT', zone.id, zone);
  });

  return zone;
}

// Table operations
export async function createTable(
  database: BarMvpDB,
  data: Omit<TableElement, 'id' | 'updatedAt'> & { id?: string }
): Promise<TableElement> {
  const table: TableElement = {
    id: data.id || crypto.randomUUID(),
    zoneId: data.zoneId,
    name: data.name,
    shape: data.shape,
    x: data.x,
    y: data.y,
    width: data.width,
    height: data.height,
    rotation: data.rotation ?? 0,
    seats: data.seats,
    status: data.status || 'available',
    updatedAt: Date.now(),
  };

  await database.transaction('rw', database.restaurantTables, database.sync_queue, async () => {
    await database.restaurantTables.add(table);
    await logSyncEvent(database, 'table', 'INSERT', table.id, table);
  });

  return table;
}

export async function updateTablePosition(
  database: BarMvpDB,
  tableId: string,
  x: number,
  y: number,
  rotation?: number
): Promise<void> {
  const updateData: Partial<TableElement> = {
    x,
    y,
    updatedAt: Date.now(),
  };
  if (rotation !== undefined) {
    updateData.rotation = rotation;
  }

  await database.transaction('rw', database.restaurantTables, database.sync_queue, async () => {
    await database.restaurantTables.update(tableId, updateData);
    await logSyncEvent(database, 'table', 'UPDATE', tableId, updateData);
  });
}

export async function updateTable(
  database: BarMvpDB,
  tableId: string,
  changes: Partial<TableElement>
): Promise<void> {
  const updateData = {
    ...changes,
    updatedAt: Date.now(),
  };

  await database.transaction('rw', database.restaurantTables, database.sync_queue, async () => {
    await database.restaurantTables.update(tableId, updateData);
    await logSyncEvent(database, 'table', 'UPDATE', tableId, updateData);
  });
}

export async function updateTableStatus(
  database: BarMvpDB,
  tableId: string,
  status: TableStatus
): Promise<void> {
  await database.transaction('rw', database.restaurantTables, database.sync_queue, async () => {
    const changes = { status, updatedAt: Date.now() };
    await database.restaurantTables.update(tableId, changes);
    await logSyncEvent(database, 'table', 'UPDATE', tableId, changes);
  });
}

export async function deleteTable(
  database: BarMvpDB,
  tableId: string
): Promise<void> {
  await database.transaction('rw', database.restaurantTables, database.sync_queue, async () => {
    await database.restaurantTables.delete(tableId);
    await logSyncEvent(database, 'table', 'DELETE', tableId, { id: tableId });
  });
}

// Reservation operations
export async function createReservation(
  database: BarMvpDB,
  data: Omit<Reservation, 'id' | 'createdAt'> & { id?: string }
): Promise<Reservation> {
  const res: Reservation = {
    id: data.id || crypto.randomUUID(),
    tableId: data.tableId || null,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    date: data.date,
    time: data.time,
    pax: data.pax,
    notes: data.notes,
    status: data.status || 'confirmed',
    createdAt: Date.now(),
  };

  await database.transaction('rw', database.reservations, database.sync_queue, async () => {
    await database.reservations.add(res);
    await logSyncEvent(database, 'reservation', 'INSERT', res.id, res);
  });

  return res;
}

export async function updateReservationStatus(
  database: BarMvpDB,
  reservationId: string,
  status: ReservationStatus
): Promise<void> {
  await database.transaction('rw', database.reservations, database.sync_queue, async () => {
    await database.reservations.update(reservationId, { status });
    await logSyncEvent(database, 'reservation', 'UPDATE', reservationId, { status });
  });
}

export async function seatReservation(
  database: BarMvpDB,
  reservationId: string,
  tableId: string
): Promise<void> {
  await database.transaction('rw', database.reservations, database.restaurantTables, database.sync_queue, async () => {
    await database.reservations.update(reservationId, { tableId, status: 'seated' });
    await logSyncEvent(database, 'reservation', 'UPDATE', reservationId, { tableId, status: 'seated' });

    const tableChanges = { status: 'occupied' as TableStatus, updatedAt: Date.now() };
    await database.restaurantTables.update(tableId, tableChanges);
    await logSyncEvent(database, 'table', 'UPDATE', tableId, tableChanges);
  });
}

export async function completeReservation(
  database: BarMvpDB,
  reservationId: string,
  tableId?: string | null
): Promise<void> {
  await database.transaction('rw', database.reservations, database.restaurantTables, database.sync_queue, async () => {
    await database.reservations.update(reservationId, { status: 'completed' });
    await logSyncEvent(database, 'reservation', 'UPDATE', reservationId, { status: 'completed' });

    if (tableId) {
      const tableChanges = { status: 'available' as TableStatus, updatedAt: Date.now() };
      await database.restaurantTables.update(tableId, tableChanges);
      await logSyncEvent(database, 'table', 'UPDATE', tableId, tableChanges);
    }
  });
}

export async function cancelReservation(
  database: BarMvpDB,
  reservationId: string,
  tableId?: string | null
): Promise<void> {
  await database.transaction('rw', database.reservations, database.restaurantTables, database.sync_queue, async () => {
    await database.reservations.update(reservationId, { status: 'cancelled' });
    await logSyncEvent(database, 'reservation', 'UPDATE', reservationId, { status: 'cancelled' });

    if (tableId) {
      const tableChanges = { status: 'available' as TableStatus, updatedAt: Date.now() };
      await database.restaurantTables.update(tableId, tableChanges);
      await logSyncEvent(database, 'table', 'UPDATE', tableId, tableChanges);
    }
  });
}
