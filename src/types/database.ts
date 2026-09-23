export type TableShape = 'round' | 'square' | 'rectangle' | 'counter';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'blocked';

export type ReservationStatus = 'confirmed' | 'seated' | 'cancelled' | 'no_show' | 'completed';

export type SyncAction = 'INSERT' | 'UPDATE' | 'DELETE';

export type SyncEntity = 'zone' | 'table' | 'reservation' | 'customer';

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

export interface SyncEvent {
  id?: number;
  entity: SyncEntity;
  action: SyncAction;
  entityId: string;
  payload: any;
  createdAt: number;
  status: SyncStatus;
}

export interface DatabaseBackup {
  version: number;
  exportedAt: number;
  data: {
    zones: Zone[];
    tables: TableElement[];
    reservations: Reservation[];
    customers: Customer[];
    syncQueue: SyncEvent[];
  };
}
