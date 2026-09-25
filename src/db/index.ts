import Dexie, { type Table } from 'dexie';
import {
  Zone,
  TableElement,
  Reservation,
  Customer,
  TableSession,
  WaiterCall,
  SyncEvent,
  SyncEntity,
  SyncAction,
  TableStatus,
  ProductCategory,
  Product,
  ProductOrder,
  OrderItem,
  AppSettings,
} from '../types/database';

export class BarMvpDB extends Dexie {
  zones!: Table<Zone, string>;
  restaurantTables!: Table<TableElement, string>;
  reservations!: Table<Reservation, string>;
  customers!: Table<Customer, string>;
  table_sessions!: Table<TableSession, string>;
  waiter_calls!: Table<WaiterCall, string>;
  sync_queue!: Table<SyncEvent, number>;
  product_categories!: Table<ProductCategory, string>;
  products!: Table<Product, string>;
  product_orders!: Table<ProductOrder, string>;
  order_items!: Table<OrderItem, string>;
  app_settings!: Table<AppSettings, string>;

  constructor(dbName = 'BarRestoFlowDB') {
    super(dbName);

    this.version(1).stores({
      zones: 'id, name, isDefault, createdAt',
      restaurantTables: 'id, zoneId, name, shape, status, seats, updatedAt',
      reservations: 'id, tableId, date, time, status, customerName, createdAt',
      customers: 'id, name, phone, email, createdAt',
      sync_queue: '++id, entity, action, entityId, status, createdAt',
    });

    this.version(2).stores({
      zones: 'id, name, isDefault, createdAt',
      restaurantTables: 'id, zoneId, name, shape, status, seats, updatedAt',
      reservations: 'id, tableId, date, time, status, customerName, createdAt',
      customers: 'id, name, phone, email, createdAt',
      table_sessions: 'id, tableId, sessionWord, status, [tableId+status], openedAt, closedAt',
      waiter_calls: 'id, tableId, sessionId, reason, status, createdAt',
      sync_queue: '++id, entity, action, entityId, status, createdAt',
    });

    this.version(3).stores({
      zones: 'id, name, isDefault, createdAt',
      restaurantTables: 'id, zoneId, name, shape, status, seats, updatedAt',
      reservations: 'id, tableId, date, time, status, customerName, createdAt',
      customers: 'id, name, phone, email, createdAt',
      table_sessions: 'id, tableId, sessionWord, status, [tableId+status], openedAt, closedAt',
      waiter_calls: 'id, tableId, sessionId, reason, status, createdAt',
      sync_queue: '++id, entity, action, entityId, status, createdAt',
      product_categories: 'id, tenantId, sortOrder',
      products: 'id, tenantId, categoryId, isActive, totalOrders',
      product_orders: 'id, tenantId, tableId, sessionId, status, createdAt',
      order_items: 'id, orderId, productId',
      app_settings: 'key, tenantId',
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

// Re-export domain-specific operations
export * from './waiterCalls';
export * from './reservations';
export * from './catalog';
