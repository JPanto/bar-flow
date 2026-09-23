import React from 'react';
import { TableElement, Reservation, TableStatus } from '../../types/database';
import { getTableStatusColors } from '../../utils/canvasUtils';
import {
  X,
  Users,
  CheckCircle,
  Ban,
  Clock,
  Phone,
  UserCheck,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface TableServiceModalProps {
  table: TableElement | null;
  activeReservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (tableId: string, status: TableStatus) => void;
  onSeatReservation: (reservationId: string, tableId: string) => void;
  onCompleteReservation: (reservationId: string, tableId: string) => void;
  onOpenReservationForm: (tableId: string) => void;
}

export const TableServiceModal: React.FC<TableServiceModalProps> = ({
  table,
  activeReservation,
  isOpen,
  onClose,
  onUpdateStatus,
  onSeatReservation,
  onCompleteReservation,
  onOpenReservationForm,
}) => {
  if (!isOpen || !table) return null;

  const statusColors = getTableStatusColors(table.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header with Table Badge */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border shadow-lg"
              style={{
                backgroundColor: statusColors.fill,
                borderColor: statusColors.stroke,
                color: statusColors.badgeText,
              }}
            >
              {table.seats}p
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{table.name}</h3>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: `${statusColors.stroke}25`,
                    color: statusColors.stroke,
                  }}
                >
                  {statusColors.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Capacidad máxima: {table.seats} comensales
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Active Reservation Details Card (if any) */}
          {activeReservation ? (
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-amber-400 font-semibold text-sm">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Reserva Asignada</span>
                </div>
                <span className="flex items-center gap-1 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  {activeReservation.time}
                </span>
              </div>

              <div className="text-sm space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>{activeReservation.customerName}</span>
                  <span className="text-xs font-normal text-amber-300">
                    ({activeReservation.pax} comensales)
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {activeReservation.customerPhone}
                </div>
                {activeReservation.notes && (
                  <p className="text-xs italic text-amber-200/80 bg-amber-950/40 p-2 rounded-lg mt-2">
                    "{activeReservation.notes}"
                  </p>
                )}
              </div>

              {activeReservation.status === 'confirmed' && (
                <button
                  onClick={() => {
                    onSeatReservation(activeReservation.id, table.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  Sentar Reserva Ahora
                </button>
              )}

              {activeReservation.status === 'seated' && (
                <button
                  onClick={() => {
                    onCompleteReservation(activeReservation.id, table.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Finalizar Atención y Liberar Mesa
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
              <span>No hay reservas vinculadas a esta mesa en este momento.</span>
            </div>
          )}

          {/* Quick Status Action Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Acciones Rápidas
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              {table.status !== 'occupied' ? (
                <button
                  onClick={() => {
                    onUpdateStatus(table.id, 'occupied');
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/50 text-rose-300 font-semibold text-xs rounded-xl transition-all active:scale-95 shadow-md shadow-rose-950/30"
                >
                  <Users className="w-4 h-4 text-rose-400" />
                  Ocupar Mesa (Walk-in)
                </button>
              ) : (
                <button
                  onClick={() => {
                    onUpdateStatus(table.id, 'available');
                    if (activeReservation) {
                      onCompleteReservation(activeReservation.id, table.id);
                    }
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/50 text-emerald-300 font-semibold text-xs rounded-xl transition-all active:scale-95 shadow-md shadow-emerald-950/30"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Liberar Mesa
                </button>
              )}

              {table.status !== 'reserved' ? (
                <button
                  onClick={() => {
                    onOpenReservationForm(table.id);
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800/50 text-amber-300 font-semibold text-xs rounded-xl transition-all active:scale-95"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Reservar Mesa
                </button>
              ) : (
                <button
                  onClick={() => {
                    onUpdateStatus(table.id, 'available');
                    onClose();
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all"
                >
                  Quitar Reserva
                </button>
              )}

              <button
                onClick={() => {
                  onUpdateStatus(table.id, table.status === 'blocked' ? 'available' : 'blocked');
                  onClose();
                }}
                className={`col-span-2 flex items-center justify-center gap-2 py-2.5 px-4 font-semibold text-xs rounded-xl border transition-all ${
                  table.status === 'blocked'
                    ? 'bg-slate-800 text-emerald-400 border-slate-700'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                {table.status === 'blocked' ? 'Desbloquear Mesa' : 'Bloquear Mesa (Fuera de Servicio)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
