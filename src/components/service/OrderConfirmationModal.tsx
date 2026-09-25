import React, { useState, useEffect } from 'react';
import { ProductOrder, OrderItem } from '../../types/database';
import { db } from '../../db';
import { calculateUrgency } from '../../utils/urgencyGradient';
import { formatCurrency } from '../../utils/currency';
import { X, Clock, CheckCircle2, Ban, AlertCircle, ShoppingBag, Loader2 } from 'lucide-react';

export type ConfirmableOrder = (Partial<ProductOrder> & {
  id: string;
  tableName: string;
  sessionWord: string;
  totalAmount: number;
  createdAt: number;
  items?: OrderItem[];
  urgency?: any;
}) | ProductOrder;

export interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ConfirmableOrder | null;
  items?: OrderItem[];
  onConfirm: (orderId: string) => Promise<{ success: boolean; reason?: string }>;
  onReject: (orderId: string, reason?: string) => Promise<{ success: boolean; reason?: string }>;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  onClose,
  order,
  items: propItems,
  onConfirm,
  onReject,
}) => {
  const [localItems, setLocalItems] = useState<OrderItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);
    if (!order) {
      setLocalItems([]);
      return;
    }
    if (order.items && order.items.length > 0) {
      setLocalItems(order.items);
    } else if (propItems && propItems.length > 0) {
      setLocalItems(propItems);
    } else {
      db.order_items
        .where('orderId')
        .equals(order.id)
        .toArray()
        .then((items) => setLocalItems(items))
        .catch(() => setLocalItems([]));
    }
  }, [order, propItems]);

  if (!isOpen || !order) return null;

  const urgency = calculateUrgency(order.createdAt, Date.now());

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await onConfirm(order.id);
      if (result.success) {
        onClose();
      } else {
        if (result.reason?.startsWith('insufficient_stock_for_')) {
          const prodName = result.reason.replace('insufficient_stock_for_', '');
          setErrorMessage(`Stock insuficiente para ${prodName} (disponible: 0)`);
        } else {
          setErrorMessage(result.reason || 'No se pudo confirmar el pedido');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al confirmar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await onReject(order.id);
      if (result.success) {
        onClose();
      } else {
        setErrorMessage(result.reason || 'No se pudo rechazar el pedido');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al rechazar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-apple-card border border-apple-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-apple-border flex items-center justify-between bg-apple-card/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-apple-blue/15 border border-apple-blue/30 flex items-center justify-center text-apple-blue shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-apple-label">{order.tableName}</h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-apple-fill text-apple-green font-bold border border-apple-border">
                  {order.sessionWord}
                </span>
              </div>
              <p className="text-xs text-apple-label-sec">Validación física de comanda en mesa</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="px-2.5 py-1 rounded-full text-xs font-bold text-black flex items-center gap-1 shadow-sm"
              style={{ backgroundColor: urgency.hslColor }}
            >
              <Clock className="w-3 h-3" />
              <span>{urgency.formattedTime}</span>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 text-apple-label-sec hover:text-apple-label hover:bg-apple-fill active:scale-95 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-apple-red/15 border border-apple-red/30 text-apple-red text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-2">
            {localItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 p-3 bg-apple-fill/50 border border-apple-border/50 rounded-2xl text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-apple-label text-sm">
                    <span className="text-apple-blue font-extrabold">{item.quantity}x</span>
                    <span className="truncate">{item.productName}</span>
                  </div>
                  {item.notes && (
                    <p className="text-[11px] text-apple-label-sec italic mt-1 bg-apple-card/60 p-1.5 rounded-lg border border-apple-border/40">
                      Nota: "{item.notes}"
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-apple-label text-sm">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                  <p className="text-[10px] text-apple-label-sec font-medium">
                    {formatCurrency(item.unitPrice)} c/u
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Total summary */}
          <div className="p-3.5 bg-apple-fill border border-apple-border rounded-2xl flex items-center justify-between">
            <span className="font-bold text-apple-label text-xs uppercase tracking-wider">
              Total a pagar en mesa:
            </span>
            <span className="font-black text-apple-label text-base">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-apple-border bg-apple-card/90 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            onClick={handleReject}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-apple-red/40 text-apple-red bg-apple-red/10 hover:bg-apple-red/20 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            <Ban className="w-4 h-4" />
            <span>Rechazar Pedido</span>
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full sm:flex-1 px-4 py-3 rounded-2xl bg-apple-green text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-apple-green/20 hover:opacity-95 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Confirmar y Despachar Pedido</span>
          </button>
        </div>
      </div>
    </div>
  );
};
