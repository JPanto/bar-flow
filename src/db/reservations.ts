import type { BarMvpDB } from './index';
import { logSyncEvent } from './index';
import type { Reservation, ReservationStatus, TableStatus } from '../types/database';

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
