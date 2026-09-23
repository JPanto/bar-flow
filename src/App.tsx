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
} from './db';
import { seedInitialData } from './db/seed';
import { TableElement, Reservation, TableShape } from './types/database';
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

export const App: React.FC = () => {
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

    // Initial seed check
    seedInitialData(db);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Live queries from Dexie
  const zones = useLiveQuery(() => db.zones.toArray()) || [];
  const allTables = useLiveQuery(() => db.restaurantTables.toArray()) || [];
  const reservations = useLiveQuery(() => db.reservations.toArray()) || [];
  const pendingSyncCount =
    useLiveQuery(() => db.sync_queue.where({ status: 'pending' }).count()) || 0;

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

    setSelectedTableId(newTable.id);
  };

  const handleUpdateTable = async (tableId: string, changes: Partial<TableElement>) => {
    await updateTable(db, tableId, changes);
  };

  const handleDeleteSelected = async () => {
    if (!selectedTableId) return;
    if (confirm('¿Eliminar esta mesa del croquis?')) {
      await deleteTable(db, selectedTableId);
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
  };

  const handleOpenReservationFormForTable = (tableId: string) => {
    setReservationDefaultTableId(tableId);
    setIsReservationModalOpen(true);
  };

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
            onSeatReservation={(rId, tId) => seatReservation(db, rId, tId)}
            onCompleteReservation={(rId, tId) => completeReservation(db, rId, tId)}
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
          setSelectedTableId(null);
        }}
      />

      {/* Table Service Modal (Service Mode) */}
      <TableServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        table={serviceTable}
        activeReservation={serviceTable ? getActiveReservationForTable(serviceTable.id) : null}
        onUpdateStatus={(id, status) => updateTableStatus(db, id, status)}
        onSeatReservation={(rId, tId) => seatReservation(db, rId, tId)}
        onCompleteReservation={(rId, tId) => completeReservation(db, rId, tId)}
        onOpenReservationForm={handleOpenReservationFormForTable}
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
    </div>
  );
};

export default App;
