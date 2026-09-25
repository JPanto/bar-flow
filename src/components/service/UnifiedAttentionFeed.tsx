import React from 'react';
import { AttentionItem } from '../../types/database';
import { Bell, ShoppingBag, Receipt, HelpCircle, Clock, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export interface UnifiedAttentionFeedProps {
  items: (AttentionItem | any)[];
  onSelectCall?: (item: any) => void;
  onSelectOrder?: (item: any) => void;
  className?: string;
}

const getCallReasonLabel = (reason?: string): string => {
  switch (reason) {
    case 'bill':
      return 'Pedir Cuenta';
    case 'help':
      return 'Asistencia';
    default:
      return 'Llamado Mesero';
  }
};

const getCallReasonIcon = (reason?: string) => {
  switch (reason) {
    case 'bill':
      return <Receipt className="w-3.5 h-3.5 text-apple-orange" />;
    case 'help':
      return <HelpCircle className="w-3.5 h-3.5 text-apple-blue" />;
    default:
      return <Bell className="w-3.5 h-3.5 text-apple-green" />;
  }
};

const formatTimeBadge = (urgency?: any, createdAt?: number): string => {
  if (urgency?.formattedTime) return urgency.formattedTime;
  const elapsedMs = urgency?.elapsedMs ?? (createdAt ? Date.now() - createdAt : 0);
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const UnifiedAttentionFeed: React.FC<UnifiedAttentionFeedProps> = ({
  items,
  onSelectCall,
  onSelectOrder,
  className = '',
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      className={`w-full overflow-x-auto no-scrollbar py-2 px-3 sm:px-5 bg-apple-card/70 backdrop-blur-xl border-b border-apple-border/60 transition-colors select-none ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-max">
        <span className="text-[11px] font-bold uppercase tracking-wider text-apple-label-sec px-1 hidden sm:inline">
          Atención:
        </span>
        {items.map((item) => {
          const isCall = item.type === 'call';
          const urgencyColor = item.urgency?.color || item.urgency?.hslColor || '#f59e0b';
          const isUrgent = item.urgency?.isUrgent || item.urgency?.isCritical || false;
          const timeBadge = formatTimeBadge(item.urgency, item.createdAt);

          return (
            <button
              key={item.id}
              data-testid={`attention-item-${item.id}`}
              type="button"
              onClick={() => (isCall ? onSelectCall?.(item) : onSelectOrder?.(item))}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl border text-left transition-all active:scale-[0.97] touch-manipulation cursor-pointer shadow-sm hover:shadow-md ${
                isUrgent ? 'animate-pulse' : ''
              }`}
              style={{
                borderColor: urgencyColor,
                backgroundColor: item.urgency?.hslBgColor || `${urgencyColor}18`,
              }}
            >
              {/* Type Icon Badge */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: `${urgencyColor}25`,
                  borderColor: `${urgencyColor}40`,
                }}
              >
                {isCall ? (
                  getCallReasonIcon(item.reason)
                ) : (
                  <ShoppingBag className="w-4 h-4 text-apple-blue" />
                )}
              </div>

              {/* Information Cluster */}
              <div className="flex flex-col min-w-[130px] max-w-[220px]">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="font-extrabold text-xs text-apple-label truncate">
                    {item.tableName}
                  </span>
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-black flex items-center gap-0.5 shrink-0"
                    style={{ backgroundColor: urgencyColor }}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    {timeBadge}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1 mt-0.5">
                  {isCall ? (
                    <span className="text-[11px] text-apple-label-sec font-medium truncate">
                      {getCallReasonLabel(item.reason)}
                    </span>
                  ) : (
                    <span className="text-[11px] text-apple-label-sec font-medium truncate">
                      {item.itemSummary || 'Pedido de productos'}
                    </span>
                  )}

                  {!isCall && item.totalAmount !== undefined && (
                    <span className="text-[11px] font-bold text-apple-label shrink-0">
                      {formatCurrency(item.totalAmount)}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="w-3.5 h-3.5 text-apple-label-sec/60 shrink-0 ml-0.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
