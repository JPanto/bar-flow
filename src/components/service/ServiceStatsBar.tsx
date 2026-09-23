import React from 'react';
import { TableElement } from '../../types/database';
import { Users, Utensils } from 'lucide-react';

interface ServiceStatsBarProps {
  tables: TableElement[];
}

export const ServiceStatsBar: React.FC<ServiceStatsBarProps> = ({ tables }) => {
  const total = tables.length;
  const available = tables.filter((t) => t.status === 'available').length;
  const occupied = tables.filter((t) => t.status === 'occupied').length;
  const reserved = tables.filter((t) => t.status === 'reserved').length;

  const totalSeats = tables.reduce((acc, t) => acc + t.seats, 0);
  const occupiedSeats = tables
    .filter((t) => t.status === 'occupied')
    .reduce((acc, t) => acc + t.seats, 0);

  const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
      {/* Status Counters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Utensils className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Total Mesas:</span>
          <span className="font-bold text-white">{total}</span>
        </div>

        <div className="h-3 w-px bg-slate-800" />

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400">Libres:</span>
          <span className="font-bold text-emerald-400">{available}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="text-slate-400">Ocupadas:</span>
          <span className="font-bold text-rose-400">{occupied}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-400">Reservadas:</span>
          <span className="font-bold text-amber-400">{reserved}</span>
        </div>
      </div>

      {/* Guest capacity and occupancy % */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Comensales:</span>
          <span className="font-bold text-white">
            {occupiedSeats} / {totalSeats}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyRate > 80 ? 'bg-rose-500' : occupancyRate > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
          <span className="font-semibold text-slate-300 min-w-8 text-right">
            {occupancyRate}%
          </span>
        </div>
      </div>
    </div>
  );
};
