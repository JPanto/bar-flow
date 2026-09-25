import React from 'react';
import { Product } from '../../types/database';
import { formatPrice } from './ProductCard';
import { ShoppingBag, X, Plus, Minus, ArrowRight, Loader2, MessageSquare } from 'lucide-react';

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface OrderCartDrawerProps {
  items: CartItem[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onUpdateQuantity: (quantity: number, product: Product) => void;
  onUpdateNotes: (productId: string, notes: string) => void;
  onSubmitOrder: () => Promise<void> | void;
  isSubmitting?: boolean;
}

export const OrderCartDrawer: React.FC<OrderCartDrawerProps> = ({
  items,
  isOpen,
  onOpen,
  onClose,
  onUpdateQuantity,
  onUpdateNotes,
  onSubmitOrder,
  isSubmitting = false,
}) => {
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (totalCount === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Bar Trigger */}
      {!isOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-30 max-w-lg mx-auto pb-[env(safe-area-inset-bottom,0px)]">
          <button
            onClick={onOpen}
            className="w-full bg-apple-green text-white px-5 py-3.5 rounded-2xl shadow-xl shadow-apple-green/25 flex items-center justify-between font-bold text-sm active:scale-[0.98] transition-all cursor-pointer border border-apple-green/40 hover:bg-apple-green/90"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span>
                Ver Pedido ({totalCount} {totalCount === 1 ? 'item' : 'items'}) — {formatPrice(totalAmount)}
              </span>
            </div>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Expanded Bottom Sheet Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg mx-auto bg-apple-card border-t border-apple-border rounded-t-3xl shadow-2xl flex flex-col max-h-[85dvh] pb-[env(safe-area-inset-bottom,1rem)]"
            role="dialog"
            aria-modal="true"
            aria-label="Detalle de tu pedido"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-apple-border flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base text-apple-label">Tu Pedido</h2>
                <p className="text-xs text-apple-label-sec">
                  {totalCount} {totalCount === 1 ? 'producto seleccionado' : 'productos seleccionados'}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar pedido"
                className="w-8 h-8 rounded-full bg-apple-fill flex items-center justify-center text-apple-label-sec hover:text-apple-label hover:bg-apple-border active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Item Breakdown */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-apple-border/40">
              {items.map((item) => {
                const isMax = item.quantity >= item.product.stock;
                return (
                  <div key={item.product.id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-apple-label">
                          {item.product.name}
                        </h4>
                        <span className="text-xs text-apple-label-sec font-mono">
                          {formatPrice(item.product.price)} c/u
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-apple-label font-mono">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                        <div className="flex items-center gap-1.5 bg-apple-fill rounded-xl p-1 border border-apple-border">
                          <button
                            onClick={() => onUpdateQuantity(item.quantity - 1, item.product)}
                            aria-label={`Disminuir ${item.product.name}`}
                            className="w-6 h-6 rounded-lg bg-apple-card flex items-center justify-center text-apple-label hover:bg-apple-border active:scale-90 transition-all cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="min-w-4 text-center font-bold text-xs text-apple-label font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => !isMax && onUpdateQuantity(item.quantity + 1, item.product)}
                            disabled={isMax}
                            aria-label={`Aumentar ${item.product.name}`}
                            className={`w-6 h-6 rounded-lg bg-apple-card flex items-center justify-center text-apple-label hover:bg-apple-border active:scale-90 transition-all ${
                              isMax ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Note Input */}
                    <div className="flex items-center gap-2 bg-apple-fill/50 rounded-xl px-3 py-1.5 border border-apple-border/60">
                      <MessageSquare className="w-3.5 h-3.5 text-apple-label-ter shrink-0" />
                      <input
                        type="text"
                        placeholder="Nota opcional (ej. sin hielo, término medio)"
                        value={item.notes || ''}
                        onChange={(e) => onUpdateNotes(item.product.id, e.target.value)}
                        className="w-full bg-transparent text-xs text-apple-label placeholder:text-apple-label-ter outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Summary & Action */}
            <div className="p-5 border-t border-apple-border bg-apple-card/95 space-y-3">
              <div className="flex items-center justify-between text-apple-label">
                <span className="text-sm font-semibold text-apple-label-sec">Total a Pagar</span>
                <span className="text-xl font-black font-mono">{formatPrice(totalAmount)}</span>
              </div>

              <button
                onClick={onSubmitOrder}
                disabled={isSubmitting || totalCount === 0}
                className="w-full bg-apple-green text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-lg shadow-apple-green/20 hover:bg-apple-green/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando pedido a mesa...</span>
                  </>
                ) : (
                  <span>Enviar Pedido a Mesa</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
