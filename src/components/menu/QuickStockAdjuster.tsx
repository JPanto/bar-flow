import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface QuickStockAdjusterProps {
  currentStock: number;
  onStockChange: (newStock: number) => void;
  disabled?: boolean;
}

export const QuickStockAdjuster: React.FC<QuickStockAdjusterProps> = ({
  currentStock,
  onStockChange,
  disabled = false,
}) => {
  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentStock > 0 && !disabled) {
      onStockChange(Math.max(0, currentStock - 1));
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      onStockChange(currentStock + 1);
    }
  };

  const isLowStock = currentStock > 0 && currentStock <= 5;
  const isOutOfStock = currentStock === 0;

  return (
    <div
      className="inline-flex items-center gap-1 bg-apple-fill/60 hover:bg-apple-fill/80 border border-apple-border/60 rounded-xl p-0.5 transition-colors select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label="-"
        onClick={handleDecrement}
        disabled={disabled || isOutOfStock}
        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-95 touch-manipulation cursor-pointer ${
          isOutOfStock || disabled
            ? 'opacity-30 cursor-not-allowed text-apple-label-tertiary'
            : 'text-apple-label hover:bg-apple-card hover:shadow-xs active:bg-apple-fill'
        }`}
        title="Disminuir stock (-)"
      >
        <Minus className="w-3.5 h-3.5" aria-hidden="true" />
      </button>

      <span
        className={`min-w-[28px] text-center font-bold text-xs sm:text-sm tabular-nums px-1 ${
          isOutOfStock
            ? 'text-apple-red'
            : isLowStock
            ? 'text-apple-orange font-black'
            : 'text-apple-label'
        }`}
        title={`Stock actual: ${currentStock}`}
      >
        {currentStock}
      </span>

      <button
        type="button"
        aria-label="+"
        onClick={handleIncrement}
        disabled={disabled}
        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all active:scale-95 touch-manipulation cursor-pointer ${
          disabled
            ? 'opacity-30 cursor-not-allowed text-apple-label-tertiary'
            : 'text-apple-label hover:bg-apple-card hover:shadow-xs active:bg-apple-fill'
        }`}
        title="Aumentar stock (+)"
      >
        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
};
