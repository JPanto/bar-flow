export type TableShape = 'round' | 'square' | 'rectangle' | 'counter';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'blocked';

export type ReservationStatus = 'confirmed' | 'seated' | 'cancelled' | 'no_show' | 'completed';

export type SyncAction = 'INSERT' | 'UPDATE' | 'DELETE';

export type SyncEntity =
  | 'zone'
  | 'table'
  | 'reservation'
  | 'customer'
  | 'table_session'
  | 'waiter_call'
  | 'category'
  | 'product'
  | 'product_order'
  | 'app_settings';

export type SyncStatus = 'pending' | 'synced' | 'failed';

export interface Zone {
  id: string;
  name: string;
  width: number;
  height: number;
  isDefault: boolean;
  createdAt: number;
}

export interface TableElement {
  id: string;
  zoneId: string;
  name: string;
  shape: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // 0 to 360 degrees
  seats: number;
  status: TableStatus;
  updatedAt: number;
}

export interface Reservation {
  id: string;
  tableId: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  pax: number;
  notes?: string;
  status: ReservationStatus;
  createdAt: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: number;
}

export interface TableSession {
  id: string;
  tableId: string;
  sessionWord: string;
  status: 'active' | 'closed';
  openedAt: number;
  closedAt?: number | null;
}

export type CallReason = 'waiter' | 'bill' | 'help';

export type CallStatus = 'pending' | 'attending' | 'resolved' | 'cancelled';

export interface WaiterCall {
  id: string;
  tableId: string;
  sessionId: string;
  tableName: string;
  sessionWord: string;
  reason: CallReason;
  status: CallStatus;
  createdAt: number;
  attendingAt?: number | null;
  resolvedAt?: number | null;
}

export interface SyncEvent {
  id?: number;
  entity: SyncEntity;
  action: SyncAction;
  entityId: string;
  payload: any;
  createdAt: number;
  status: SyncStatus;
}

export interface ProductCategory {
  id: string;
  tenantId?: string;
  name: string;
  sortOrder: number;
  createdAt: number;
}

export interface Product {
  id: string;
  tenantId?: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  isActive: boolean;
  totalOrders: number;
  updatedAt: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'rejected' | 'delivered';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

export interface ProductOrder {
  id: string;
  tenantId?: string;
  tableId: string;
  sessionId: string;
  tableName: string;
  sessionWord: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: number;
  confirmedAt?: number | null;
  items?: OrderItem[];
}

export interface AppSettings {
  key: string;
  tenantId?: string;
  value: any;
  updatedAt?: number;
}

export interface DatabaseBackup {
  version: number;
  exportedAt: number;
  data: {
    zones: Zone[];
    tables: TableElement[];
    reservations: Reservation[];
    customers: Customer[];
    tableSessions?: TableSession[];
    waiterCalls?: WaiterCall[];
    productCategories?: ProductCategory[];
    products?: Product[];
    productOrders?: ProductOrder[];
    orderItems?: OrderItem[];
    appSettings?: AppSettings[];
    syncQueue: SyncEvent[];
  };
}

