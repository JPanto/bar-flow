import React from 'react';
import { TableElement, Reservation, TableSession, WaiterCall } from '../../types/database';
import { useStaffModals } from '../../hooks/useStaffModals';
import { TableInspectorModal } from '../croquis/TableInspectorModal';
import { TableServiceModal } from '../service/TableServiceModal';
import { ReservationModal } from '../reservations/ReservationModal';
import { BackupModal } from '../common/BackupModal';
import { CallsQueueDrawer } from '../service/CallsQueueDrawer';
import { AppMenuDrawer } from '../layout/AppMenuDrawer';
import { TableQrModal } from '../croquis/TableQrModal';
import { OrderConfirmationModal } from '../service/OrderConfirmationModal';

export interface StaffModalsProps {
  modals: ReturnType<typeof useStaffModals>;
  selectedTable: TableElement | null;
  onUpdateTable: (tableId: string, changes: Partial<TableElement>) => void;
  onDeleteTable: (tableId: string) => void;
  activeReservation: Reservation | null;
  activeSession: TableSession | null;
  activeCall: WaiterCall | null;
  onUpdateStatus: (tableId: string, status: any) => void;
  onSeatReservation: (resId: string, tableId: string) => void;
  onCompleteReservation: (resId: string, tableId: string) => void;
  onAttendCall: (callId: string) => void;
  onResolveCall: (callId: string) => void;
  onSaveReservation: (data: Omit<Reservation, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  allTables: TableElement[];
  pendingSyncCount: number;
  calls: WaiterCall[];
  isOnline: boolean;
  activeCallsCount: number;
  qrSession: TableSession | null;
  onSimulateCustomer: (tableId: string) => void;
  onConfirmOrder: (orderId: string) => Promise<{ success: boolean; reason?: string }>;
  onRejectOrder: (orderId: string, reason?: string) => Promise<{ success: boolean; reason?: string }>;
}

export const StaffModals: React.FC<StaffModalsProps> = ({
  modals,
  selectedTable,
  onUpdateTable,
  onDeleteTable,
  activeReservation,
  activeSession,
  activeCall,
  onUpdateStatus,
  onSeatReservation,
  onCompleteReservation,
  onAttendCall,
  onResolveCall,
  onSaveReservation,
  allTables,
  pendingSyncCount,
  calls,
  isOnline,
  activeCallsCount,
  qrSession,
  onSimulateCustomer,
  onConfirmOrder,
  onRejectOrder,
}) => {
  return (
    <>
      <TableInspectorModal
        isOpen={modals.isInspectorOpen}
        onClose={() => modals.setIsInspectorOpen(false)}
        table={selectedTable}
        onSave={onUpdateTable}
        onDelete={onDeleteTable}
      />

      <TableServiceModal
        isOpen={modals.isServiceModalOpen}
        onClose={() => modals.setIsServiceModalOpen(false)}
        table={modals.serviceTable}
        activeReservation={activeReservation}
        activeSession={activeSession}
        activeCall={activeCall}
        onUpdateStatus={onUpdateStatus}
        onSeatReservation={onSeatReservation}
        onCompleteReservation={onCompleteReservation}
        onOpenReservationForm={modals.openReservationModal}
        onOpenQrModal={modals.openQrModal}
        onAttendCall={onAttendCall}
        onResolveCall={onResolveCall}
      />

      <ReservationModal
        isOpen={modals.isReservationModalOpen}
        onClose={() => modals.setIsReservationModalOpen(false)}
        onSave={onSaveReservation}
        tables={allTables}
        defaultTableId={modals.reservationDefaultTableId}
      />

      <BackupModal
        isOpen={modals.isBackupOpen}
        onClose={() => modals.setIsBackupOpen(false)}
        pendingSyncCount={pendingSyncCount}
      />

      <CallsQueueDrawer
        isOpen={modals.isCallsDrawerOpen}
        onClose={() => modals.setIsCallsDrawerOpen(false)}
        calls={calls}
        onAttend={onAttendCall}
        onResolve={onResolveCall}
      />

      <AppMenuDrawer
        isOpen={modals.isMenuOpen}
        onClose={() => modals.setIsMenuOpen(false)}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        activeCallsCount={activeCallsCount}
        onOpenBackup={() => {
          modals.setIsMenuOpen(false);
          modals.setIsBackupOpen(true);
        }}
        onOpenCallsQueue={() => {
          modals.setIsMenuOpen(false);
          modals.setIsCallsDrawerOpen(true);
        }}
      />

      <TableQrModal
        isOpen={modals.isQrModalOpen}
        onClose={() => modals.setIsQrModalOpen(false)}
        table={modals.qrTable}
        session={qrSession}
        onSimulateInApp={onSimulateCustomer}
      />

      <OrderConfirmationModal
        isOpen={modals.isOrderModalOpen}
        onClose={() => {
          modals.setIsOrderModalOpen(false);
          modals.setSelectedOrder(null);
        }}
        order={modals.selectedOrder}
        onConfirm={onConfirmOrder}
        onReject={onRejectOrder}
      />
    </>
  );
};
