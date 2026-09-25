import React, { useState } from 'react';
import { useCustomerSession } from '../../hooks/useCustomerSession';
import { useOrderManagement } from '../../hooks/useOrderManagement';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { CustomerMenu } from './CustomerMenu';
import { CustomerAssistanceView } from './CustomerAssistanceView';
import { formatPrice } from './ProductCard';
import {
  UtensilsCrossed,
  BellRing,
  BookOpen,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react';

interface CustomerPortalProps {
  tableId: string;
  onExitToStaff?: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ tableId, onExitToStaff }) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'assistance'>('menu');
  const {
    table,
    activeSession,
    activeCall,
    urgency,
    copied,
    isSubmitting: isSubmittingCall,
    handleCopyWord,
    handleCall,
    handleCancelCall,
  } = useCustomerSession(tableId);

  const { cancelOrder, isProcessing: isCancellingOrder } = useOrderManagement();

  // Reactive subscription for active pending orders on this table
  const pendingOrders = useLiveQuery(
    async () => {
      const orders = await db.product_orders
        .where('tableId')
        .equals(tableId)
        .toArray();
      const pending = orders.filter((o) => o.status === 'pending');
      return await Promise.all(
        pending.map(async (order) => {
          const items = await db.order_items.where('orderId').equals(order.id).toArray();
          return { ...order, items };
        })
      );
    },
    [tableId]
  );

  const handleExit = () => {
    if (onExitToStaff) {
      onExitToStaff();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('mesa');
      window.location.href = url.pathname + (url.search ? url.search : '');
    }
  };

  if (!table) {
    return (
      <div className="min-h-[100dvh] bg-apple-bg text-apple-label flex flex-col items-center justify-center p-6 text-center select-none pt-[env(safe-area-inset-top,1.5rem)] pb-[env(safe-area-inset-bottom,1.5rem)]">
        <UtensilsCrossed className="w-12 h-12 text-apple-label-sec mb-4 animate-bounce" />
        <h2 className="text-xl font-bold mb-2">Mesa no encontrada</h2>
        <p className="text-apple-label-sec text-sm max-w-sm mb-6">
          El identificador de mesa no es válido o la mesa fue removida del plano.
        </p>
        <button
          onClick={handleExit}
          className="px-5 py-2.5 bg-apple-fill text-apple-label text-xs font-semibold rounded-2xl active:scale-[0.97] transition-transform duration-100 touch-manipulation cursor-pointer"
        >
          Ir al Panel Principal
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-apple-bg text-apple-label flex flex-col justify-between relative shadow-2xl overflow-x-hidden selection:bg-apple-green selection:text-black pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] select-none">
      {/* Top Header */}
      <header className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-apple-border bg-apple-card/80 backdrop-blur-xl sticky top-0 z-20 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-apple-green flex items-center justify-center text-white shadow-md shadow-apple-green/20">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-apple-label leading-tight">
              {table.name}
            </h1>
            <p className="text-[11px] text-apple-green font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-apple-green animate-pulse" />
              Mesa Conectada
            </p>
          </div>
        </div>

        <button
          onClick={handleExit}
          className="text-[11px] text-apple-label-sec hover:text-apple-label px-3 py-1.5 rounded-xl hover:bg-apple-fill border border-apple-border transition-all active:scale-[0.97] touch-manipulation cursor-pointer"
        >
          Ir al Panel
        </button>
      </header>

      {/* Navigation Tabs (Menú & Pedidos / Asistencia & Cuenta) */}
      <div className="w-full max-w-lg mx-auto px-4 pt-3">
        <div className="grid grid-cols-2 p-1 bg-apple-fill/70 rounded-2xl border border-apple-border">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-apple-card text-apple-label shadow-sm'
                : 'text-apple-label-sec hover:text-apple-label'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Menú & Pedidos</span>
          </button>
          <button
            onClick={() => setActiveTab('assistance')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              activeTab === 'assistance'
                ? 'bg-apple-card text-apple-label shadow-sm'
                : 'text-apple-label-sec hover:text-apple-label'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Asistencia & Cuenta</span>
            {activeCall && (
              <span className="w-2 h-2 rounded-full bg-apple-orange animate-ping absolute top-2 right-3" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-lg mx-auto p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto overscroll-y-contain">
        {/* Active Pending Orders Banner */}
        {pendingOrders && pendingOrders.length > 0 && (
          <div className="space-y-2">
            {pendingOrders.map((order) => {
              const itemCount = order.items?.reduce((s, it) => s + it.quantity, 0) || 0;
              return (
                <div
                  key={order.id}
                  className="bg-apple-orange/10 border border-apple-orange/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm animate-in fade-in"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-apple-orange/20 text-apple-orange flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-apple-label">
                        Pedido pendiente de confirmación
                      </h4>
                      <p className="text-[11px] text-apple-label-sec font-mono mt-0.5">
                        {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'} • {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => cancelOrder(order.id, 'Cancelado por el cliente')}
                    disabled={isCancellingOrder}
                    className="px-2.5 py-1.5 rounded-xl bg-apple-card border border-apple-red/30 text-apple-red hover:bg-apple-red/10 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isCancellingOrder ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    <span>Cancelar</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'menu' ? (
          <CustomerMenu
            tableId={tableId}
            sessionId={activeSession?.id}
            tableName={table.name}
            sessionWord={activeSession?.sessionWord}
          />
        ) : (
          <CustomerAssistanceView
            activeSession={activeSession}
            activeCall={activeCall}
            urgency={urgency}
            copied={copied}
            isSubmitting={isSubmittingCall}
            handleCopyWord={handleCopyWord}
            handleCall={handleCall}
            handleCancelCall={handleCancelCall}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="p-3 text-center border-t border-apple-border text-[11px] text-apple-label-ter">
        Bar & Resto Flow • Experiencia en Mesa
      </footer>
    </div>
  );
};
