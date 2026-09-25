import React, { useState } from 'react';
import { Reservation, TableElement } from '../../types/database';
import { DateSelector } from './DateSelector';
import { ReservationList } from './ReservationList';
import { ReservationModal } from './ReservationModal';
import { Plus, Users, CalendarCheck, Clock, BookmarkCheck } from 'lucide-react';

interface ReservationViewProps {
  reservations: Reservation[];
  tables: TableElement[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onSaveReservation: (data: Omit<Reservation, 'id' | 'createdAt'> & { id?: string }) => void;
  onSeatReservation: (reservationId: string, tableId: string) => void;
  onCompleteReservation: (reservationId: string, tableId?: string | null) => void;
  onCancelReservation: (reservationId: string, tableId?: string | null) => void;
}

export const ReservationView: React.FC<ReservationViewProps> = ({
  reservations,
  tables,
  selectedDate,
  onSelectDate,
  onSaveReservation,
  onSeatReservation,
  onCompleteReservation,
  onCancelReservation,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  // Daily statistics
  const dayReservations = reservations.filter((r) => r.date === selectedDate);
  const totalPax = dayReservations.reduce((acc, r) => acc + r.pax, 0);
  const confirmedCount = dayReservations.filter((r) => r.status === 'confirmed').length;
  const seatedCount = dayReservations.filter((r) => r.status === 'seated').length;
  const assignedCount = dayReservations.filter((r) => r.tableId !== null).length;

  const handleOpenNew = () => {
    setEditingReservation(null);
    setIsModalOpen(true);
  };

  const handleEdit = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-apple-bg text-apple-label overflow-y-auto p-4 sm:p-6 space-y-6 transition-colors">
      {/* Top Banner: Date Selector and New Reservation Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <DateSelector selectedDate={selectedDate} onSelectDate={onSelectDate} />

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-apple-green hover:opacity-95 active:scale-[0.97] text-white font-bold text-sm rounded-2xl shadow-sm transition-all shrink-0 touch-manipulation cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Reserva</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-apple-card border border-apple-border p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-apple-label-sec text-xs font-semibold uppercase tracking-wider mb-1">
            <CalendarCheck className="w-3.5 h-3.5 text-apple-green" />
            <span>Total Reservas</span>
          </div>
          <div className="text-2xl font-black text-apple-label">{dayReservations.length}</div>
          <div className="text-[11px] text-apple-label-sec mt-1">
            {confirmedCount} confirmadas • {seatedCount} sentadas
          </div>
        </div>

        <div className="bg-apple-card border border-apple-border p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-apple-label-sec text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5 text-apple-blue" />
            <span>Comensales (Pax)</span>
          </div>
          <div className="text-2xl font-black text-apple-label">{totalPax}</div>
          <div className="text-[11px] text-apple-label-sec mt-1">Personas esperadas hoy</div>
        </div>

        <div className="bg-apple-card border border-apple-border p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-apple-label-sec text-xs font-semibold uppercase tracking-wider mb-1">
            <BookmarkCheck className="w-3.5 h-3.5 text-apple-orange" />
            <span>Mesas Asignadas</span>
          </div>
          <div className="text-2xl font-black text-apple-label">
            {assignedCount} / {dayReservations.length}
          </div>
          <div className="text-[11px] text-apple-label-sec mt-1">
            {dayReservations.length - assignedCount} pendientes de asignar
          </div>
        </div>

        <div className="bg-apple-card border border-apple-border p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-apple-label-sec text-xs font-semibold uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5 text-apple-purple" />
            <span>Capacidad Total</span>
          </div>
          <div className="text-2xl font-black text-apple-label">
            {tables.reduce((acc, t) => acc + t.seats, 0)}
          </div>
          <div className="text-[11px] text-apple-label-sec mt-1">Sillas disponibles en local</div>
        </div>
      </div>

      {/* Main Table List */}
      <ReservationList
        reservations={dayReservations}
        tables={tables}
        onEdit={handleEdit}
        onSeat={onSeatReservation}
        onComplete={onCompleteReservation}
        onCancel={onCancelReservation}
      />

      {/* Form Modal */}
      <ReservationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveReservation}
        tables={tables}
        defaultDate={selectedDate}
        initialData={editingReservation}
      />
    </div>
  );
};
