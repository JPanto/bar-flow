import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  createTable,
  updateTable,
  deleteTable,
  createReservation,
  seatReservation,
  completeReservation,
  cancelReservation,
  createZone,
  updateTableStatus,
  startTableSession,
  closeTableSession,
  getActiveSessionForTable,
  attendingWaiterCall,
  resolveWaiterCall,
} from './db';
import { seedInitialData } from './db/seed';
import { TableElement, Reservation, TableShape, TableStatus } from './types/database';
import { Navbar, AppTab } from './components/layout/Navbar';
import { ZoneTabs } from './components/croquis/ZoneTabs';
import { CroquisCanvas } from './components/croquis/CroquisCanvas';
import { EditorToolbar } from './components/croquis/EditorToolbar';
import { TableInspectorModal } from './components/croquis/TableInspectorModal';
import { ServiceStatsBar } from './components/service/ServiceStatsBar';
import { TableServiceModal } from './components/service/TableServiceModal';
import { ReservationView } from './components/reservations/ReservationView';
import { ReservationModal } from './components/reservations/ReservationModal';
import { BackupModal } from './components/common/BackupModal';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { CallsQueueDrawer } from './components/service/CallsQueueDrawer';
import { TableQrModal } from './components/croquis/TableQrModal';
import { generateSessionWord } from './utils/wordGenerator';
import { calculateUrgency } from './utils/urgencyGradient';
import { realtimeService } from './services/realtime';
import { syncService } from './services/syncService';
import { playServiceChime } from './utils/soundAlert';

export const App: React.FC = () => {
  // Query param detection for Customer Mobile View (?mesa=:tableId)
  const getInitialCustomerTableId = (): string | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('mesa');
  };

  const [customerTableId, setCustomerTableId] = useState<string | null>(getInitialCustomerTableId);
  const [currentTab, setCurrentTab] = useState<AppTab>('service');
  const [activeZoneId, setActiveZoneId] = useState<string>('');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);

  // Modals state
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceTable, setServiceTable] = useState<TableElement | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [reservationDefaultTableId, setReservationDefaultTableId] = useState<string | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isCallsDrawerOpen, setIsCallsDrawerOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrTable, setQrTable] = useState<TableElement | null>(null);

  // Selected date for reservations
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  // Network online status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial seed check and sync initialization
    seedInitialData(db);
    syncService.start();

    // Sync URL when browser back/forward buttons are pressed
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setCustomerTableId(params.get('mesa'));
    };
    window.addEventListener('popstate', handlePopState);

    // Audio chime & Dexie synchronization on real-time event arrival
    const unsubscribeRealtime = realtimeService.subscribe(async (event) => {
      try {
        if (event.type === 'CALL_CREATED') {
          const call = (event.payload as any)?.call || event.payload;
          if (call && call.id) {
            await db.waiter_calls.put(call);
            playServiceChime();
          }
        } else if (event.type === 'CALL_ATTENDING') {
          const { callId, attendingAt } = (event.payload as any) || {};
          if (callId) {
            await db.waiter_calls.update(callId, {
              status: 'attending',
              attendingAt: attendingAt || Date.now(),
            });
          }
        } else if (event.type === 'CALL_RESOLVED') {
          const { callId, resolvedAt } = (event.payload as any) || {};
          if (callId) {
            await db.waiter_calls.update(callId, {
              status: 'resolved',
              resolvedAt: resolvedAt || Date.now(),
            });
          }
        } else if (event.type === 'CALL_CANCELLED') {
          const { callId } = (event.payload as any) || {};
          if (callId) {
            await db.waiter_calls.update(callId, {
              status: 'cancelled',
            });
          }
        } else if (event.type === 'SESSION_STARTED') {
          const session = (event.payload as any)?.session || event.payload;
          if (session && session.id) {
            await db.table_sessions.put(session);
          }
        } else if (event.type === 'SESSION_CLOSED') {
          const { tableId } = (event.payload as any) || {};
          if (tableId) {
            await db.table_sessions
              .where({ tableId, status: 'active' })
              .modify({ status: 'closed', closedAt: Date.now() });
          }
        } else if (event.type === 'TABLE_UPDATED') {
          const table = (event.payload as any)?.table || event.payload;
          if (table && table.id) {
            await db.restaurantTables.put(table);
          }
        } else if (event.type === 'TABLE_DELETED') {
          const { id } = (event.payload as any) || {};
          if (id) {
            await db.restaurantTables.delete(id);
          }
        } else if (event.type === 'ZONE_CREATED' || event.type === 'ZONE_UPDATED') {
          const zone = (event.payload as any)?.zone || event.payload;
          if (zone && zone.id) {
            await db.zones.put(zone);
          }
        }
      } catch (err) {
        console.error('Error syncing incoming realtime event:', err);
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('popstate', handlePopState);
      unsubscribeRealtime();
      syncService.stop();
    };
  }, []);

  // Live queries from Dexie
  const zones = useLiveQuery(() => db.zones.toArray()) || [];
  const allTables = useLiveQuery(() => db.restaurantTables.toArray()) || [];
  const reservations = useLiveQuery(() => db.reservations.toArray()) || [];
  const activeSessions =
    useLiveQuery(() => db.table_sessions.where({ status: 'active' }).toArray()) || [];
  const activeCalls =
    useLiveQuery(() =>
      db.waiter_calls.where('status').anyOf(['pending', 'attending']).toArray()
    ) || [];
  const pendingSyncCount =
    useLiveQuery(() => db.sync_queue.where({ status: 'pending' }).count()) || 0;

  // Strict FIFO sort (oldest call first) for waiter calls queue
  const sortedActiveCalls = [...activeCalls].sort((a, b) => a.createdAt - b.createdAt);
  const highestUrgency =
    sortedActiveCalls.length > 0 ? calculateUrgency(sortedActiveCalls[0].createdAt) : null;
  const highestUrgencyColor = highestUrgency ? highestUrgency.hslColor : '#10b981';

  // Ensure any table currently occupied has an active session (auto-healing on startup)
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

  // Active Zone Resolution
  useEffect(() => {
    if (zones.length > 0 && !activeZoneId) {
      const defaultZone = zones.find((z) => z.isDefault) || zones[0];
      setActiveZoneId(defaultZone.id);
    }
  }, [zones, activeZoneId]);

  const activeZone = zones.find((z) => z.id === activeZoneId) || zones[0];
  const zoneTables = allTables.filter((t) => t.zoneId === activeZone?.id);

  // Selected table object
  const selectedTable = allTables.find((t) => t.id === selectedTableId) || null;

  // Find active reservation for a given table on the current date
  const getActiveReservationForTable = (tableId: string): Reservation | null => {
    return (
      reservations.find(
        (r) =>
          r.tableId === tableId &&
          r.date === today &&
          (r.status === 'confirmed' || r.status === 'seated')
      ) || null
    );
  };

  // Waiter Call Queue Action Handlers
  const handleAttendCall = async (callId: string) => {
    await attendingWaiterCall(db, callId);
    realtimeService.publish({
      type: 'CALL_ATTENDING',
      payload: { callId },
      timestamp: Date.now(),
    });
    syncService.triggerSync();
  };

  const handleResolveCall = async (callId: string) => {
    await resolveWaiterCall(db, callId);
    realtimeService.publish({
      type: 'CALL_RESOLVED',
      payload: { callId },
      timestamp: Date.now(),
    });
    syncService.triggerSync();
  };

  // Customer Portal Navigation Handlers
  const handleExitCustomerPortal = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('mesa');
    window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
    setCustomerTableId(null);
  };

  const handleSimulateCustomer = (tableId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('mesa', tableId);
    window.history.pushState({}, '', url.toString());
    setCustomerTableId(tableId);
  };

  // Handlers for Croquis Editor
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

  const handleDeleteSelected = async () => {
    if (!selectedTableId) return;
    if (confirm('¿Eliminar esta mesa del croquis?')) {
      const idToDelete = selectedTableId;
      await deleteTable(db, idToDelete);
      realtimeService.publish({
        type: 'TABLE_DELETED',
        payload: { id: idToDelete },
        timestamp: Date.now(),
      });
      syncService.triggerSync();
      setSelectedTableId(null);
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

  // Handlers for Table Click in Service Mode
  const handleTableClick = (table: TableElement) => {
    setServiceTable(table);
    setIsServiceModalOpen(true);
  };

  // Handlers for Reservations
  const handleSaveReservation = async (
    data: Omit<Reservation, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (data.id) {
      await db.reservations.update(data.id, data);
    } else {
      await createReservation(db, data);
    }
    syncService.triggerSync();
  };

  const handleOpenReservationFormForTable = (tableId: string) => {
    setReservationDefaultTableId(tableId);
    setIsReservationModalOpen(true);
  };

  // Lifecycle Table Session Handlers
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

  // If URL has ?mesa=:tableId or user triggered simulation, render the full mobile customer experience
  if (customerTableId) {
    return (
      <CustomerPortal
        tableId={customerTableId}
        onExitToStaff={handleExitCustomerPortal}
      />
    );
  }

  if (!activeZone) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-400">
        <p className="animate-pulse">Iniciando base de datos local y croquis...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* 1. Main Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        activeCallsCount={sortedActiveCalls.length}
        highestUrgencyColor={highestUrgencyColor}
        onOpenCallsQueue={() => setIsCallsDrawerOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* 2. Zone Tabs (Shown in Service & Editor modes) */}
      {currentTab !== 'reservations' && (
        <ZoneTabs
          zones={zones}
          activeZoneId={activeZone.id}
          onSelectZone={setActiveZoneId}
          onCreateZone={handleCreateZone}
          isEditorMode={currentTab === 'editor'}
        />
      )}

      {/* 3. Live Service Operational Stats Bar (Shown only in Service mode) */}
      {currentTab === 'service' && <ServiceStatsBar tables={zoneTables} />}

      {/* 4. Main Body Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {currentTab === 'reservations' ? (
          <ReservationView
            reservations={reservations}
            tables={allTables}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSaveReservation={handleSaveReservation}
            onSeatReservation={handleSeatReservation}
            onCompleteReservation={handleCompleteReservation}
            onCancelReservation={(rId, tId) => cancelReservation(db, rId, tId)}
          />
        ) : (
          <div className="relative flex-1 w-full h-full">
            {/* Editor Floating Toolbar (Only in Editor Mode) */}
            {currentTab === 'editor' && (
              <EditorToolbar
                onAddTable={handleAddTable}
                snapToGrid={snapToGrid}
                onToggleSnap={() => setSnapToGrid(!snapToGrid)}
                selectedTable={selectedTable}
                onOpenInspector={() => setIsInspectorOpen(true)}
                onDeleteSelected={handleDeleteSelected}
              />
            )}

            {/* Interactive Croquis Canvas */}
            <CroquisCanvas
              zone={activeZone}
              tables={zoneTables}
              selectedTableId={selectedTableId}
              isEditorMode={currentTab === 'editor'}
              snapToGrid={snapToGrid}
              activeCalls={sortedActiveCalls}
              onSelectTable={setSelectedTableId}
              onUpdateTable={handleUpdateTable}
              onTableClick={handleTableClick}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      {/* Table Property Inspector Modal (Editor Mode) */}
      <TableInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        table={selectedTable}
        onSave={handleUpdateTable}
        onDelete={async (id) => {
          await deleteTable(db, id);
          realtimeService.publish({
            type: 'TABLE_DELETED',
            payload: { id },
            timestamp: Date.now(),
          });
          syncService.triggerSync();
          setSelectedTableId(null);
        }}
      />

      {/* Table Service Modal (Service Mode) */}
      <TableServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        table={serviceTable}
        activeReservation={serviceTable ? getActiveReservationForTable(serviceTable.id) : null}
        activeSession={
          serviceTable
            ? activeSessions.find((s) => s.tableId === serviceTable.id) || null
            : null
        }
        activeCall={
          serviceTable
            ? sortedActiveCalls.find((c) => c.tableId === serviceTable.id) || null
            : null
        }
        onUpdateStatus={handleUpdateTableStatus}
        onSeatReservation={handleSeatReservation}
        onCompleteReservation={handleCompleteReservation}
        onOpenReservationForm={handleOpenReservationFormForTable}
        onOpenQrModal={(table) => {
          setQrTable(table);
          setIsQrModalOpen(true);
        }}
        onAttendCall={handleAttendCall}
        onResolveCall={handleResolveCall}
      />

      {/* Direct Reservation Modal */}
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => {
          setIsReservationModalOpen(false);
          setReservationDefaultTableId(null);
        }}
        onSave={handleSaveReservation}
        tables={allTables}
        defaultTableId={reservationDefaultTableId}
      />

      {/* Offline Backup & Outbox Sync Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        pendingSyncCount={pendingSyncCount}
      />

      {/* Waiter Calls Priority Queue Drawer */}
      <CallsQueueDrawer
        isOpen={isCallsDrawerOpen}
        onClose={() => setIsCallsDrawerOpen(false)}
        calls={sortedActiveCalls}
        onAttend={handleAttendCall}
        onResolve={handleResolveCall}
      />

      {/* Table QR Access Modal */}
      <TableQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        table={qrTable}
        session={
          qrTable
            ? activeSessions.find((s) => s.tableId === qrTable.id) || null
            : null
        }
        onSimulateInApp={handleSimulateCustomer}
      />
    </div>
  );
};

export default App;
