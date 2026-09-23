import { describe, it, expect, beforeEach } from 'vitest';
import {
  BarMvpDB,
  createTable,
  createReservation,
  seatReservation,
  completeReservation,
  cancelReservation,
} from '../src/db';

describe('Reservations Flow & Table Synchronization', () => {
  let db: BarMvpDB;

  beforeEach(async () => {
    db = new BarMvpDB(`test_res_db_${Date.now()}_${Math.random()}`);
    await db.open();
  });

  it('should seat reservation and atomically update table status to occupied', async () => {
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
      status: 'available',
    });

    const res = await createReservation(db, {
      tableId: table.id,
      customerName: 'Santiago Botero',
      customerPhone: '+57 320 000 1122',
      date: '2026-09-24',
      time: '20:30',
      pax: 4,
      status: 'confirmed',
    });

    // Seat the reservation
    await seatReservation(db, res.id, table.id);

    const updatedRes = await db.reservations.get(res.id);
    expect(updatedRes?.status).toBe('seated');
    expect(updatedRes?.tableId).toBe(table.id);

    const updatedTable = await db.restaurantTables.get(table.id);
    expect(updatedTable?.status).toBe('occupied');

    // Complete the reservation
    await completeReservation(db, res.id, table.id);

    const completedRes = await db.reservations.get(res.id);
    expect(completedRes?.status).toBe('completed');

    const freedTable = await db.restaurantTables.get(table.id);
    expect(freedTable?.status).toBe('available');
  });

  it('should cancel reservation and free table if allocated', async () => {
    const table = await createTable(db, {
      zoneId: 'zone-1',
      name: 'Mesa 2',
      shape: 'round',
      x: 50,
      y: 50,
      width: 80,
      height: 80,
      rotation: 0,
      seats: 2,
      status: 'reserved',
    });

    const res = await createReservation(db, {
      tableId: table.id,
      customerName: 'Laura Restrepo',
      customerPhone: '+57 311 555 4433',
      date: '2026-09-24',
      time: '19:00',
      pax: 2,
      status: 'confirmed',
    });

    await cancelReservation(db, res.id, table.id);

    const cancelledRes = await db.reservations.get(res.id);
    expect(cancelledRes?.status).toBe('cancelled');

    const tableAfterCancel = await db.restaurantTables.get(table.id);
    expect(tableAfterCancel?.status).toBe('available');
  });
});
