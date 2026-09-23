import { BarMvpDB, createZone, createTable, createReservation } from './index';

export async function seedInitialData(database: BarMvpDB): Promise<void> {
  const zoneCount = await database.zones.count();
  if (zoneCount > 0) return; // Already seeded

  // 1. Create Main Zone
  const mainZone = await createZone(database, {
    id: 'zone-salon-principal',
    name: 'Salón Principal',
    width: 1400,
    height: 900,
    isDefault: true,
  });

  // 2. Create Initial Tables
  await createTable(database, {
    id: 'table-1',
    zoneId: mainZone.id,
    name: 'Mesa 1',
    shape: 'round',
    x: 160,
    y: 160,
    width: 90,
    height: 90,
    rotation: 0,
    seats: 4,
    status: 'available',
  });

  await createTable(database, {
    id: 'table-2',
    zoneId: mainZone.id,
    name: 'Mesa 2',
    shape: 'round',
    x: 380,
    y: 160,
    width: 90,
    height: 90,
    rotation: 0,
    seats: 4,
    status: 'occupied',
  });

  await createTable(database, {
    id: 'table-3',
    zoneId: mainZone.id,
    name: 'Mesa 3',
    shape: 'square',
    x: 160,
    y: 360,
    width: 90,
    height: 90,
    rotation: 0,
    seats: 2,
    status: 'available',
  });

  const t4 = await createTable(database, {
    id: 'table-4',
    zoneId: mainZone.id,
    name: 'Mesa 4',
    shape: 'square',
    x: 380,
    y: 360,
    width: 100,
    height: 100,
    rotation: 0,
    seats: 4,
    status: 'reserved',
  });

  await createTable(database, {
    id: 'table-5',
    zoneId: mainZone.id,
    name: 'Mesa Familiar 5',
    shape: 'rectangle',
    x: 650,
    y: 220,
    width: 200,
    height: 100,
    rotation: 0,
    seats: 6,
    status: 'available',
  });

  await createTable(database, {
    id: 'table-6',
    zoneId: mainZone.id,
    name: 'Barra Principal',
    shape: 'counter',
    x: 200,
    y: 600,
    width: 450,
    height: 60,
    rotation: 0,
    seats: 5,
    status: 'available',
  });

  // Current date formatted YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // 3. Create Sample Reservations
  await createReservation(database, {
    id: 'res-1',
    tableId: t4.id,
    customerName: 'Alejandro Silva',
    customerPhone: '+57 310 987 6543',
    customerEmail: 'alejandro@example.com',
    date: today,
    time: '20:00',
    pax: 4,
    notes: 'Preferencia mesa tranquila para cena de negocios.',
    status: 'confirmed',
  });

  await createReservation(database, {
    id: 'res-2',
    tableId: null,
    customerName: 'Valentina Morales',
    customerPhone: '+57 300 123 4567',
    customerEmail: 'valentina@example.com',
    date: today,
    time: '21:30',
    pax: 2,
    notes: 'Aniversario de bodas.',
    status: 'confirmed',
  });
}
