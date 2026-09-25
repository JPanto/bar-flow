import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createReservation, cancelReservation } from '../../db';
import { Reservation } from '../../types/database';
import { Navbar, AppTab } from '../layout/Navbar';
import { ZoneTabs } from '../croquis/ZoneTabs';
import { CroquisCanvas } from '../croquis/CroquisCanvas';
import { EditorToolbar } from '../croquis/EditorToolbar';
import { ServiceStatsBar } from '../service/ServiceStatsBar';
import { UnifiedAttentionFeed } from '../service/UnifiedAttentionFeed';
import { ReservationView } from '../reservations/ReservationView';
import { MenuManagementTab } from '../menu/MenuManagementTab';
import { StaffModals } from './StaffModals';
import { useStaffModals } from '../../hooks/useStaffModals';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { useWaiterCalls } from '../../hooks/useWaiterCalls';
import { useTableManagement } from '../../hooks/useTableManagement';
import { useUnifiedAttentionQueue } from '../../hooks/useUnifiedAttentionQueue';
import { useOrderManagement } from '../../hooks/useOrderManagement';
import { useAuth } from '../../hooks/useAuth';
import { syncService } from '../../services/syncService';

interface StaffDashboardProps {
  onSimulateCustomer: (tableId: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ onSimulateCustomer }) => {
  const [currentTab, setCurrentTab] = useState<AppTab>('service');
  const { role } = useAuth();
  const modals = useStaffModals();

  useEffect(() => {
    if (role !== 'manager' && (currentTab === 'editor' || currentTab === 'menu')) {
      setCurrentTab('service');
    }
  }, [role, currentTab]);

  const handleSelectTab = (tab: AppTab) => {
    if ((tab === 'editor' || tab === 'menu') && role !== 'manager') {
      setCurrentTab('service');
      return;
    }
    setCurrentTab(tab);
  };

  const { isOnline, pendingSyncCount } = useRealtimeSync();
  const {
    sortedActiveCalls,
    activeCallsCount,
    highestUrgencyColor,
    handleAttendCall,
    handleResolveCall,
  } = useWaiterCalls();
  const {
    items: attentionItems,
    pendingCallsCount,
    pendingOrdersCount,
    highestUrgencyColor: unifiedUrgencyColor,
  } = useUnifiedAttentionQueue();
  const { processOrderConfirmation, rejectOrder } = useOrderManagement();
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

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
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

  if (!activeZone) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-apple-bg text-apple-label-sec h-[100dvh] w-screen">
        <p className="animate-pulse">Iniciando base de datos local y croquis...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-screen bg-apple-bg text-apple-label overflow-hidden transition-colors">
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        activeCallsCount={activeCallsCount + pendingOrdersCount}
        highestUrgencyColor={unifiedUrgencyColor || highestUrgencyColor}
        onOpenCallsQueue={() => modals.setIsCallsDrawerOpen(true)}
        onOpenBackup={() => modals.setIsBackupOpen(true)}
        onOpenMenu={() => modals.setIsMenuOpen(true)}
      />

      {currentTab !== 'reservations' && currentTab !== 'menu' && (
        <ZoneTabs
          zones={zones}
          activeZoneId={activeZone.id}
          onSelectZone={setActiveZoneId}
          onCreateZone={handleCreateZone}
          isEditorMode={currentTab === 'editor'}
        />
      )}

      {currentTab === 'service' && (
        <>
          <ServiceStatsBar
            tables={zoneTables}
            pendingCallsCount={pendingCallsCount}
            pendingOrdersCount={pendingOrdersCount}
          />
          <UnifiedAttentionFeed
            items={attentionItems}
            onSelectCall={() => modals.setIsCallsDrawerOpen(true)}
            onSelectOrder={(item) => modals.openOrderConfirmation(item.order || item)}
          />
        </>
      )}

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
        ) : currentTab === 'menu' ? (
          <MenuManagementTab />
        ) : (
          <div className="relative flex-1 w-full h-full">
            {currentTab === 'editor' && (
              <EditorToolbar
                onAddTable={handleAddTable}
                snapToGrid={snapToGrid}
                onToggleSnap={() => setSnapToGrid((prev) => !prev)}
                selectedTable={selectedTable}
                onOpenInspector={() => modals.setIsInspectorOpen(true)}
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
              onTableClick={modals.openServiceModal}
            />
          </div>
        )}
      </main>

      <StaffModals
        modals={modals}
        selectedTable={selectedTable}
        onUpdateTable={handleUpdateTable}
        onDeleteTable={handleDeleteTable}
        activeReservation={
          modals.serviceTable ? getActiveReservationForTable(modals.serviceTable.id) : null
        }
        activeSession={
          modals.serviceTable
            ? activeSessions.find((s) => s.tableId === modals.serviceTable?.id) || null
            : null
        }
        activeCall={
          modals.serviceTable
            ? sortedActiveCalls.find((c) => c.tableId === modals.serviceTable?.id) || null
            : null
        }
        onUpdateStatus={handleUpdateTableStatus}
        onSeatReservation={handleSeatReservation}
        onCompleteReservation={handleCompleteReservation}
        onAttendCall={handleAttendCall}
        onResolveCall={handleResolveCall}
        onSaveReservation={handleSaveReservation}
        allTables={allTables}
        pendingSyncCount={pendingSyncCount}
        calls={sortedActiveCalls}
        isOnline={isOnline}
        activeCallsCount={activeCallsCount + pendingOrdersCount}
        qrSession={
          modals.qrTable
            ? activeSessions.find((s) => s.tableId === modals.qrTable?.id) || null
            : null
        }
        onSimulateCustomer={onSimulateCustomer}
        onConfirmOrder={processOrderConfirmation}
        onRejectOrder={rejectOrder}
      />
    </div>
  );
};
