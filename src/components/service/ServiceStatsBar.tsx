import React, { useState } from 'react';
import { TableElement } from '../../types/database';
import { Users, Utensils, ChevronDown, ChevronUp } from 'lucide-react';

interface ServiceStatsBarProps {
  tables: TableElement[];
  pendingCallsCount?: number;
  pendingOrdersCount?: number;
}

export const ServiceStatsBar: React.FC<ServiceStatsBarProps> = ({
  tables,
  pendingCallsCount = 0,
  pendingOrdersCount = 0,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <div className="w-full bg-apple-card/85 backdrop-blur-xl border-b border-apple-border text-apple-label select-none transition-colors">
      <div className="flex items-center justify-between px-3 py-1.5 sm:px-5">
        {/* Adaptive Status & Occupancy Chips (No horizontal scroll, wraps gracefully) */}
        {!isCollapsed ? (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 flex-1 min-w-0 pr-2">
            {/* Total Mesas Chip */}
            <div className="flex items-center gap-1.5 bg-apple-fill px-2.5 py-1 rounded-xl text-xs">
              <Utensils className="w-3.5 h-3.5 text-apple-label-sec shrink-0" />
              <span className="text-apple-label-sec hidden xs:inline">Mesas:</span>
              <span className="font-bold text-apple-label">{total}</span>
            </div>

            {/* Libres */}
            <div className="flex items-center gap-1.5 bg-apple-fill px-2.5 py-1 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-apple-green animate-pulse shrink-0" />
              <span className="text-apple-label-sec hidden xs:inline">Libres:</span>
              <span className="font-bold text-apple-green">{available}</span>
            </div>

            {/* Ocupadas */}
            <div className="flex items-center gap-1.5 bg-apple-fill px-2.5 py-1 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-apple-red shrink-0" />
              <span className="text-apple-label-sec hidden xs:inline">Ocupadas:</span>
              <span className="font-bold text-apple-red">{occupied}</span>
            </div>

            {/* Reservadas */}
            <div className="flex items-center gap-1.5 bg-apple-fill px-2.5 py-1 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-apple-orange shrink-0" />
              <span className="text-apple-label-sec hidden xs:inline">Reservadas:</span>
              <span className="font-bold text-apple-orange">{reserved}</span>
            </div>

            {/* Llamados Pendientes */}
            {pendingCallsCount > 0 && (
              <div className="flex items-center gap-1.5 bg-apple-orange/15 border border-apple-orange/30 px-2.5 py-1 rounded-xl text-xs text-apple-orange">
                <span className="w-2 h-2 rounded-full bg-apple-orange animate-pulse shrink-0" />
                <span className="font-bold">
                  {pendingCallsCount} {pendingCallsCount === 1 ? 'llamado' : 'llamados'}
                </span>
              </div>
            )}

            {/* Pedidos Pendientes */}
            {pendingOrdersCount > 0 && (
              <div className="flex items-center gap-1.5 bg-apple-blue/15 border border-apple-blue/30 px-2.5 py-1 rounded-xl text-xs text-apple-blue">
                <span className="w-2 h-2 rounded-full bg-apple-blue animate-pulse shrink-0" />
                <span className="font-bold">
                  📦 {pendingOrdersCount} {pendingOrdersCount === 1 ? 'pedido en espera' : 'pedidos en espera'}
                </span>
              </div>
            )}

            {/* Comensales y Ocupación */}
            <div className="flex items-center gap-2 bg-apple-fill px-2.5 py-1 rounded-xl text-xs ml-auto sm:ml-0">
              <Users className="w-3.5 h-3.5 text-apple-label-sec shrink-0" />
              <span className="font-bold text-apple-label whitespace-nowrap">
                {occupiedSeats}/{totalSeats}p
              </span>
              <div className="w-14 sm:w-20 h-1.5 bg-apple-border rounded-full overflow-hidden shrink-0 hidden xs:block">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${occupancyRate}%`,
                    backgroundColor:
                      occupancyRate > 80 ? 'var(--apple-red)' : occupancyRate > 50 ? 'var(--apple-orange)' : 'var(--apple-green)',
                  }}
                />
              </div>
              <span className="font-bold text-apple-label-sec text-[10px]">{occupancyRate}%</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-apple-label-sec py-0.5">
            <span className="font-medium">Métricas de servicio ocultas</span>
            <span className="text-[10px] bg-apple-fill px-2 py-0.5 rounded-lg text-apple-label">
              {occupied}/{total} mesas • {occupancyRate}%
              {pendingCallsCount > 0 ? ` • 🔔 ${pendingCallsCount}` : ''}
              {pendingOrdersCount > 0 ? ` • 📦 ${pendingOrdersCount}` : ''}
            </span>
          </div>
        )}

        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-apple-label-sec hover:text-apple-label hover:bg-apple-fill rounded-lg transition-all active:scale-[0.96] touch-manipulation cursor-pointer shrink-0 ml-1"
          title={isCollapsed ? 'Mostrar barra de métricas' : 'Ocultar barra de métricas'}
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
