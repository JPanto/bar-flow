import React, { useState } from 'react';
import { Reservation, TableElement, ReservationStatus } from '../../types/database';
import {
  Clock,
  Users,
  Phone,
  CheckCircle2,
  XCircle,
  UserCheck,
  Edit2,
  Calendar,
} from 'lucide-react';

interface ReservationListProps {
  reservations: Reservation[];
  tables: TableElement[];
  onSeat: (reservationId: string, tableId: string) => void;
  onComplete: (reservationId: string, tableId?: string | null) => void;
  onCancel: (reservationId: string, tableId?: string | null) => void;
  onEdit: (reservation: Reservation) => void;
}

export const ReservationList: React.FC<ReservationListProps> = ({
  reservations,
  tables,
  onSeat,
  onComplete,
  onCancel,
  onEdit,
}) => {
  const [filter, setFilter] = useState<'all' | ReservationStatus>('all');

  // Filter reservations
  const filtered = reservations.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  // Sort by time
  const sorted = [...filtered].sort((a, b) => a.time.localeCompare(b.time));

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Confirmada
          </span>
        );
      case 'seated':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
            Sentada
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Completada
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            filter === 'all'
              ? 'bg-apple-fill text-apple-label font-semibold shadow-xs'
              : 'text-apple-secondary hover:text-apple-label'
          }`}
        >
          Todas ({reservations.length})
        </button>
        <button
          onClick={() => setFilter('confirmed')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            filter === 'confirmed'
              ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 font-semibold'
              : 'text-apple-secondary hover:text-apple-label'
          }`}
        >
          Confirmadas ({reservations.filter((r) => r.status === 'confirmed').length})
        </button>
        <button
          onClick={() => setFilter('seated')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            filter === 'seated'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'text-apple-secondary hover:text-apple-label'
          }`}
        >
          Sentadas ({reservations.filter((r) => r.status === 'seated').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            filter === 'completed'
              ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-semibold'
              : 'text-apple-secondary hover:text-apple-label'
          }`}
        >
          Completadas ({reservations.filter((r) => r.status === 'completed').length})
        </button>
      </div>

      {/* Reservation Cards */}
      {sorted.length === 0 ? (
        <div className="text-center py-12 bg-apple-card/50 rounded-2xl border border-apple-border">
          <Calendar className="w-10 h-10 text-apple-secondary/60 mx-auto mb-2" />
          <p className="text-sm font-semibold text-apple-label">No hay reservas para esta fecha</p>
          <p className="text-xs text-apple-secondary mt-1">Usa el botón "Nueva Reserva" para agendar comensales.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sorted.map((res) => {
            const table = tables.find((t) => t.id === res.tableId);

            return (
              <div
                key={res.id}
                className="bg-apple-card border border-apple-border rounded-2xl p-4 space-y-3 hover:border-apple-subtle transition-all shadow-sm"
              >
                {/* Header: Time, Pax, Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-sm font-bold text-apple-label bg-apple-fill px-2.5 py-1 rounded-xl">
                      <Clock className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      {res.time}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-apple-secondary font-semibold bg-apple-fill px-2 py-1 rounded-xl">
                      <Users className="w-3.5 h-3.5 text-apple-secondary" />
                      {res.pax} pax
                    </span>
                  </div>
                  {getStatusBadge(res.status)}
                </div>

                {/* Customer info & Table */}
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-apple-label">{res.customerName}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-apple-secondary">
                    <a
                      href={`https://wa.me/${res.customerPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {res.customerPhone}
                    </a>

                    <span className="text-apple-secondary/60">•</span>

                    {table ? (
                      <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-lg border border-blue-500/30">
                        {table.name} ({table.seats} sillas)
                      </span>
                    ) : (
                      <span className="text-amber-500 dark:text-amber-400 italic bg-amber-500/15 px-2 py-0.5 rounded-lg">
                        Sin mesa asignada
                      </span>
                    )}
                  </div>

                  {res.notes && (
                    <p className="text-xs text-apple-secondary bg-apple-fill p-2 rounded-xl mt-1.5 border border-apple-border">
                      "{res.notes}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-apple-border">
                  <button
                    onClick={() => onEdit(res)}
                    className="flex items-center gap-1 text-xs text-apple-secondary hover:text-apple-label px-2 py-1 rounded-lg hover:bg-apple-fill transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>

                  <div className="flex items-center gap-2">
                    {res.status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => {
                            if (res.tableId) {
                              onSeat(res.id, res.tableId);
                            } else {
                              onEdit(res); // prompt to assign table first
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Sentar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Cancelar la reserva de ${res.customerName}?`)) {
                              onCancel(res.id, res.tableId);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-500/15 rounded-xl transition-colors"
                          title="Cancelar reserva"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {res.status === 'seated' && (
                      <button
                        onClick={() => onComplete(res.id, res.tableId)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-apple-fill hover:opacity-80 text-apple-label text-xs font-semibold rounded-xl transition-colors border border-apple-border"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                        Completar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
