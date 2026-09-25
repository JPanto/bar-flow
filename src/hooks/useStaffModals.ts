import { useState } from 'react';
import { TableElement } from '../types/database';

export function useStaffModals() {
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceTable, setServiceTable] = useState<TableElement | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [reservationDefaultTableId, setReservationDefaultTableId] = useState<string | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isCallsDrawerOpen, setIsCallsDrawerOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrTable, setQrTable] = useState<TableElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const openServiceModal = (table: TableElement) => {
    setServiceTable(table);
    setIsServiceModalOpen(true);
  };

  const openQrModal = (table: TableElement) => {
    setQrTable(table);
    setIsQrModalOpen(true);
  };

  const openReservationModal = (tableId?: string | null) => {
    setReservationDefaultTableId(tableId || null);
    setIsReservationModalOpen(true);
  };

  const openOrderConfirmation = (order: any) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  return {
    isInspectorOpen,
    setIsInspectorOpen,
    isServiceModalOpen,
    setIsServiceModalOpen,
    serviceTable,
    openServiceModal,
    isReservationModalOpen,
    setIsReservationModalOpen,
    reservationDefaultTableId,
    openReservationModal,
    isBackupOpen,
    setIsBackupOpen,
    isCallsDrawerOpen,
    setIsCallsDrawerOpen,
    isQrModalOpen,
    setIsQrModalOpen,
    qrTable,
    openQrModal,
    isMenuOpen,
    setIsMenuOpen,
    selectedOrder,
    setSelectedOrder,
    isOrderModalOpen,
    setIsOrderModalOpen,
    openOrderConfirmation,
  };
}
