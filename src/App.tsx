import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createReservation, cancelReservation } from './db';
import { TableElement, Reservation } from './types/database';
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
import { useRealtimeSync } from './hooks/useRealtimeSync';
import { useWaiterCalls } from './hooks/useWaiterCalls';
import { useTableManagement } from './hooks/useTableManagement';
import { syncService } from './services/syncService';

export const App: React.FC = () => {
  // Query param detection for Customer Mobile View (?mesa=:tableId)
  const getInitialCustomerTableId = (): string | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('mesa');
  };

  const [customerTableId, setCustomerTableId] = useState<string | null>(getInitialCustomerTableId);
  const [currentTab, setCurrentTab] = useState<AppTab>('service');

  // Modular Custom Hooks
  const { isOnline, pendingSyncCount } = useRealtimeSync();
  const {
    sortedActiveCalls,
    activeCallsCount,
    highestUrgencyColor,
    handleAttendCall,
    handleResolveCall,
  } = useWaiterCalls();
  const {
    zones,
    activeZone,
    setActiveZoneId,
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
  } = useTableManagement();

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

  // Browser navigation popstate
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setCustomerTableId(params.get('mesa'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Live reservations query
  const reservations = useLiveQuery(() => db.reservations.toArray()) || [];

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

  const handleTableClick = (table: TableElement) => {
    setServiceTable(table);
    setIsServiceModalOpen(true);
  };

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

  // If customer mode is active (?mesa=:tableId), render Customer Portal
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
        activeCallsCount={activeCallsCount}
        highestUrgencyColor={highestUrgencyColor}
        onOpenCallsQueue={() => setIsCallsDrawerOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* 2. Zone Tabs */}
      {currentTab !== 'reservations' && (
        <ZoneTabs
          zones={zones}
          activeZoneId={activeZone.id}
          onSelectZone={setActiveZoneId}
          onCreateZone={handleCreateZone}
          isEditorMode={currentTab === 'editor'}
        />
      )}

      {/* 3. Operational Stats Bar */}
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
            {currentTab === 'editor' && (
              <EditorToolbar
                onAddTable={handleAddTable}
                snapToGrid={snapToGrid}
                onToggleSnap={() => setSnapToGrid((prev) => !prev)}
                selectedTable={selectedTable}
                onOpenInspector={() => setIsInspectorOpen(true)}
                onDeleteSelected={handleDeleteSelected}
              />
            )}

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
      <TableInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        table={selectedTable}
        onSave={handleUpdateTable}
        onDelete={handleDeleteTable}
      />

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

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        pendingSyncCount={pendingSyncCount}
      />

      <CallsQueueDrawer
        isOpen={isCallsDrawerOpen}
        onClose={() => setIsCallsDrawerOpen(false)}
        calls={sortedActiveCalls}
        onAttend={handleAttendCall}
        onResolve={handleResolveCall}
      />

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
