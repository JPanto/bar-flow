import React from 'react';
import { TableElement, Reservation, TableStatus, TableSession, WaiterCall } from '../../types/database';
import { getTableStatusColors } from '../../utils/canvasUtils';
import { calculateUrgency } from '../../utils/urgencyGradient';
import {
  X, Users, CheckCircle, Ban, Clock, Phone, UserCheck, Calendar, AlertCircle, QrCode, BellRing, Navigation
} from 'lucide-react';

interface TableServiceModalProps {
  table: TableElement | null;
  activeReservation: Reservation | null;
  activeSession?: TableSession | null;
  activeCall?: WaiterCall | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (tableId: string, status: TableStatus) => void;
  onSeatReservation: (reservationId: string, tableId: string) => void;
  onCompleteReservation: (reservationId: string, tableId: string) => void;
  onOpenReservationForm: (tableId: string) => void;
  onOpenQrModal?: (table: TableElement) => void;
  onAttendCall?: (callId: string) => void;
  onResolveCall?: (callId: string) => void;
}

export const TableServiceModal: React.FC<TableServiceModalProps> = ({
  table, activeReservation, activeSession, activeCall, isOpen, onClose,
  onUpdateStatus, onSeatReservation, onCompleteReservation, onOpenReservationForm,
  onOpenQrModal, onAttendCall, onResolveCall,
}) => {
  if (!isOpen || !table) return null;
  const statusColors = getTableStatusColors(table.status);
  const callUrgency = activeCall ? calculateUrgency(activeCall.createdAt) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-apple-card border border-apple-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-apple-border">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base border shadow-sm"
              style={{ backgroundColor: statusColors.fill, borderColor: statusColors.stroke, color: statusColors.badgeText }}
            >
              {table.seats}p
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-apple-label leading-tight">{table.name}</h3>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ backgroundColor: `${statusColors.stroke}25`, color: statusColors.stroke }}
                >
                  {statusColors.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-apple-label-sec">Capacidad: {table.seats} comensales</p>
                {activeSession && (
                  <span className="font-mono text-[10px] font-bold text-apple-green bg-apple-green/15 px-2 py-0.5 rounded-md border border-apple-green/30">
                    {activeSession.sessionWord}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-apple-label-sec hover:text-apple-label hover:bg-apple-fill active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Active Call Alert */}
          {activeCall && callUrgency && (
            <div
              className="border rounded-2xl p-3.5 space-y-2.5 shadow-md"
              style={{ backgroundColor: callUrgency.hslBgColor, borderColor: callUrgency.hslColor }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-apple-label">
                  <BellRing className="w-4 h-4 text-apple-orange animate-bounce" />
                  <span>Llamado: {activeCall.reason === 'bill' ? 'Pedir Cuenta' : 'Mesero'}</span>
                </div>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full text-black" style={{ backgroundColor: callUrgency.hslColor }}>
                  {callUrgency.formattedTime}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {activeCall.status === 'pending' ? (
                  <button onClick={() => onAttendCall && onAttendCall(activeCall.id)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-apple-fill text-apple-label font-semibold text-xs rounded-xl active:scale-[0.97] transition-all touch-manipulation cursor-pointer">
                    <Navigation className="w-3.5 h-3.5 text-apple-blue" />
                    <span>En camino</span>
                  </button>
                ) : (
                  <span className="flex-1 text-center py-1.5 text-xs text-apple-green font-semibold bg-apple-green/15 rounded-xl">Atendiendo</span>
                )}
                <button onClick={() => onResolveCall && onResolveCall(activeCall.id)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-apple-green text-white font-semibold text-xs rounded-xl shadow-sm active:scale-[0.97] transition-all touch-manipulation cursor-pointer">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Resolver</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Reservation Details Card */}
          {activeReservation ? (
            <div className="bg-apple-orange/10 border border-apple-orange/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-apple-orange font-semibold text-sm">
                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span>Reserva Asignada</span></div>
                <span className="flex items-center gap-1 text-xs"><Clock className="w-3.5 h-3.5" />{activeReservation.time}</span>
              </div>
              <div className="text-sm space-y-1">
                <div className="font-bold text-apple-label flex items-center gap-2">
                  <span>{activeReservation.customerName}</span>
                  <span className="text-xs font-normal text-apple-orange">({activeReservation.pax} pax)</span>
                </div>
                <div className="text-xs text-apple-label-sec flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{activeReservation.customerPhone}</div>
                {activeReservation.notes && <p className="text-xs italic text-apple-label-sec bg-apple-fill p-2 rounded-xl mt-1">"{activeReservation.notes}"</p>}
              </div>
              {activeReservation.status === 'confirmed' ? (
                <button onClick={() => { onSeatReservation(activeReservation.id, table.id); onClose(); }} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-apple-green text-white font-semibold text-xs rounded-xl shadow-sm active:scale-[0.97] transition-all touch-manipulation cursor-pointer">
                  <UserCheck className="w-4 h-4" />Sentar Reserva Ahora
                </button>
              ) : (
                <button onClick={() => { onCompleteReservation(activeReservation.id, table.id); onClose(); }} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-apple-fill text-apple-label font-semibold text-xs rounded-xl active:scale-[0.97] transition-all touch-manipulation cursor-pointer">
                  <CheckCircle className="w-4 h-4 text-apple-green" />Finalizar y Liberar
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs text-apple-label-sec bg-apple-secondary p-3 rounded-2xl border border-apple-border flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-apple-label-ter shrink-0" />
              <span>No hay reservas vinculadas a esta mesa en este momento.</span>
            </div>
          )}

          {/* Quick Status Action Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-apple-label-sec uppercase tracking-wider">Acciones de Mesa</label>
            <div className="grid grid-cols-2 gap-2.5">
              {table.status !== 'occupied' ? (
                <button onClick={() => { onUpdateStatus(table.id, 'occupied'); onClose(); }} className="flex items-center justify-center gap-2 py-2.5 px-3 bg-apple-red/15 text-apple-red border border-apple-red/30 font-semibold text-xs rounded-xl active:scale-[0.97] transition-all touch-manipulation cursor-pointer">
                  <Users className="w-4 h-4" />Ocupar Mesa
                </button>
              ) : (
                <button onClick={() => { onUpdateStatus(table.id, 'available'); if (activeReservation) onCompleteReservation(activeReservation.id, table.id); onClose(); }} className="flex items-center justify-center gap-2 py-2.5 px-3 bg-apple-green/15 text-apple-green border border-apple-green/30 font-semibold text-xs rounded-xl active:scale-[0.97] transition-all touch-manipulation cursor-pointer">
                  <CheckCircle className="w-4 h-4" />Liberar Mesa
                </button>
              )}

              {table.status !== 'reserved' ? (
                <button onClick={() => { onOpenReservationForm(table.id); onClose(); }} className="flex items-center justify-center gap-2 py-2.5 px-3 bg-apple-orange/15 text-apple-orange border border-apple-orange/30 font-semibold text-xs rounded-xl active:scale-[0.97] transition-all touch-manipulation cursor-pointer">
                  <Calendar className="w-4 h-4" />Reservar Mesa
                </button>
              ) : (
                <button onClick={() => { onUpdateStatus(table.id, 'available'); onClose(); }} className="flex items-center justify-center gap-2 py-2.5 px-3 bg-apple-fill text-apple-label font-semibold text-xs rounded-xl active:scale-[0.97] transition-all touch-manipulation cursor-pointer">
                  Quitar Reserva
                </button>
              )}

              <button onClick={() => { if (onOpenQrModal) onOpenQrModal(table); onClose(); }} className="col-span-2 flex items-center justify-center gap-2 py-2.5 px-4 font-semibold text-xs rounded-xl bg-apple-green/15 text-apple-green border border-apple-green/30 active:scale-[0.97] transition-all touch-manipulation cursor-pointer">
                <QrCode className="w-4 h-4" /><span>Código QR & Vista Cliente Móvil</span>
              </button>

              <button onClick={() => { onUpdateStatus(table.id, table.status === 'blocked' ? 'available' : 'blocked'); onClose(); }} className={`col-span-2 flex items-center justify-center gap-2 py-2.5 px-4 font-semibold text-xs rounded-xl border active:scale-[0.97] transition-all touch-manipulation cursor-pointer ${table.status === 'blocked' ? 'bg-apple-green/15 text-apple-green border-apple-green/30' : 'bg-apple-fill text-apple-label-sec border-apple-border hover:text-apple-label'}`}>
                <Ban className="w-3.5 h-3.5" />{table.status === 'blocked' ? 'Desbloquear Mesa' : 'Bloquear Mesa (Fuera de Servicio)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
