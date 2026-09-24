import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  createTable,
  updateTable,
  deleteTable,
  createZone,
  updateTableStatus,
  startTableSession,
  closeTableSession,
  getActiveSessionForTable,
  seatReservation,
  completeReservation,
} from '../db';
import { TableElement, Zone, TableSession, TableShape, TableStatus } from '../types/database';
import { generateSessionWord } from '../utils/wordGenerator';
import { realtimeService } from '../services/realtime';
import { syncService } from '../services/syncService';

export interface UseTableManagementReturn {
  zones: Zone[];
  activeZoneId: string;
  setActiveZoneId: (id: string) => void;
  activeZone: Zone | undefined;
  allTables: TableElement[];
  zoneTables: TableElement[];
  selectedTableId: string | null;
  setSelectedTableId: (id: string | null) => void;
  selectedTable: TableElement | null;
  activeSessions: TableSession[];
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean | ((prev: boolean) => boolean)) => void;
  handleAddTable: (
    shape: TableShape,
    seats: number,
    width: number,
    height: number,
    namePrefix: string
  ) => Promise<void>;
  handleUpdateTable: (tableId: string, changes: Partial<TableElement>) => Promise<void>;
  handleDeleteSelected: () => Promise<void>;
  handleDeleteTable: (tableId: string) => Promise<void>;
  handleCreateZone: (name: string) => Promise<void>;
  handleUpdateTableStatus: (tableId: string, status: TableStatus) => Promise<void>;
  handleSeatReservation: (reservationId: string, tableId: string) => Promise<void>;
  handleCompleteReservation: (reservationId: string, tableId?: string | null) => Promise<void>;
}

export function useTableManagement(): UseTableManagementReturn {
  const [activeZoneId, setActiveZoneId] = useState<string>('');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Live queries
  const zones = useLiveQuery(() => db.zones.toArray()) || [];
  const allTables = useLiveQuery(() => db.restaurantTables.toArray()) || [];
  const activeSessions =
    useLiveQuery(() => db.table_sessions.where({ status: 'active' }).toArray()) || [];

  // Active Zone Resolution
  useEffect(() => {
    if (zones.length > 0 && !activeZoneId) {
      const defaultZone = zones.find((z) => z.isDefault) || zones[0];
      setActiveZoneId(defaultZone.id);
    }
  }, [zones, activeZoneId]);

  const activeZone = zones.find((z) => z.id === activeZoneId) || zones[0];
  const zoneTables = allTables.filter((t) => t.zoneId === activeZone?.id);
  const selectedTable = allTables.find((t) => t.id === selectedTableId) || null;

  // Auto-healing: Ensure any table currently occupied has an active session
  useEffect(() => {
    const ensureOccupiedSessions = async () => {
      const occupiedTables = allTables.filter((t) => t.status === 'occupied');
      for (const t of occupiedTables) {
        const session = await getActiveSessionForTable(db, t.id);
        if (!session) {
          const currentSessions = await db.table_sessions.where({ status: 'active' }).toArray();
          const activeWords = currentSessions.map((s) => s.sessionWord);
          const word = generateSessionWord(activeWords);
          await startTableSession(db, t.id, word);
        }
      }
    };
    if (allTables.length > 0) {
      ensureOccupiedSessions();
    }
  }, [allTables]);

  const handleAddTable = async (
    shape: TableShape,
    seats: number,
    width: number,
    height: number,
    namePrefix: string
  ) => {
    if (!activeZone) return;

    const count = zoneTables.length + 1;
    const newTable = await createTable(db, {
      zoneId: activeZone.id,
      name: `${namePrefix} ${count}`,
      shape,
      x: 200 + ((count * 30) % 300),
      y: 200 + ((count * 20) % 200),
      width,
      height,
      rotation: 0,
      seats,
      status: 'available',
    });

    realtimeService.publish({
      type: 'TABLE_UPDATED',
      payload: newTable,
      timestamp: Date.now(),
    });
    syncService.triggerSync();

    setSelectedTableId(newTable.id);
  };

  const handleUpdateTable = async (tableId: string, changes: Partial<TableElement>) => {
    await updateTable(db, tableId, changes);
    const updated = await db.restaurantTables.get(tableId);
    if (updated) {
      realtimeService.publish({
        type: 'TABLE_UPDATED',
        payload: updated,
        timestamp: Date.now(),
      });
    }
    syncService.triggerSync();
  };

  const handleDeleteTable = async (tableId: string) => {
    await deleteTable(db, tableId);
    realtimeService.publish({
      type: 'TABLE_DELETED',
      payload: { id: tableId },
      timestamp: Date.now(),
    });
    syncService.triggerSync();
    if (selectedTableId === tableId) {
      setSelectedTableId(null);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedTableId) return;
    if (confirm('¿Eliminar esta mesa del croquis?')) {
      await handleDeleteTable(selectedTableId);
    }
  };

  const handleCreateZone = async (name: string) => {
    const newZone = await createZone(db, {
      name,
      width: 1600,
      height: 1000,
      isDefault: false,
    });
    realtimeService.publish({
      type: 'ZONE_CREATED',
      payload: newZone,
      timestamp: Date.now(),
    });
    syncService.triggerSync();
    setActiveZoneId(newZone.id);
  };

  const handleUpdateTableStatus = async (tableId: string, status: TableStatus) => {
    await updateTableStatus(db, tableId, status);
    if (status === 'occupied') {
      const existing = await getActiveSessionForTable(db, tableId);
      if (!existing) {
        const currentSessions = await db.table_sessions.where({ status: 'active' }).toArray();
        const activeWords = currentSessions.map((s) => s.sessionWord);
        const sessionWord = generateSessionWord(activeWords);
        const session = await startTableSession(db, tableId, sessionWord);
        realtimeService.publish({
          type: 'SESSION_STARTED',
          payload: { session },
          timestamp: Date.now(),
        });
      }
    } else if (status === 'available') {
      await closeTableSession(db, tableId);
      realtimeService.publish({
        type: 'SESSION_CLOSED',
        payload: { tableId },
        timestamp: Date.now(),
      });
    }

    const updated = await db.restaurantTables.get(tableId);
    if (updated) {
      realtimeService.publish({
        type: 'TABLE_UPDATED',
        payload: updated,
        timestamp: Date.now(),
      });
    }
    syncService.triggerSync();
  };

  const handleSeatReservation = async (reservationId: string, tableId: string) => {
    await seatReservation(db, reservationId, tableId);
    const existing = await getActiveSessionForTable(db, tableId);
    if (!existing) {
      const currentSessions = await db.table_sessions.where({ status: 'active' }).toArray();
      const activeWords = currentSessions.map((s) => s.sessionWord);
      const sessionWord = generateSessionWord(activeWords);
      const session = await startTableSession(db, tableId, sessionWord);
      realtimeService.publish({
        type: 'SESSION_STARTED',
        payload: { session },
        timestamp: Date.now(),
      });
    }

    const updated = await db.restaurantTables.get(tableId);
    if (updated) {
      realtimeService.publish({
        type: 'TABLE_UPDATED',
        payload: updated,
        timestamp: Date.now(),
      });
    }
    syncService.triggerSync();
  };

  const handleCompleteReservation = async (reservationId: string, tableId?: string | null) => {
    await completeReservation(db, reservationId, tableId || '');
    if (tableId) {
      await closeTableSession(db, tableId);
      realtimeService.publish({
        type: 'SESSION_CLOSED',
        payload: { tableId },
        timestamp: Date.now(),
      });

      const updated = await db.restaurantTables.get(tableId);
      if (updated) {
        realtimeService.publish({
          type: 'TABLE_UPDATED',
          payload: updated,
          timestamp: Date.now(),
        });
      }
    }
    syncService.triggerSync();
  };

  return {
    zones,
    activeZoneId,
    setActiveZoneId,
    activeZone,
    allTables,
    zoneTables,
    selectedTableId,
    setSelectedTableId,
    selectedTable,
    activeSessions,
    snapToGrid,
    setSnapToGrid,
    handleAddTable,
    handleUpdateTable,
    handleDeleteSelected,
    handleDeleteTable,
    handleCreateZone,
    handleUpdateTableStatus,
    handleSeatReservation,
    handleCompleteReservation,
  };
}
