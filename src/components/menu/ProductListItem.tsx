import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Product } from '../../types/database';
import { QuickStockAdjuster } from './QuickStockAdjuster';
import { formatPrice } from '../customer/ProductCard';

export interface ProductListItemProps {
  product: Product;
  categoryName: string;
  onStockChange: (newStock: number) => void;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProductListItem: React.FC<ProductListItemProps> = ({
  product,
  categoryName,
  onStockChange,
  onToggleActive,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      className={`p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-apple-fill/40 transition-colors ${
        !product.isActive ? 'opacity-60 bg-apple-fill/20' : ''
      }`}
    >
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-apple-label truncate">{product.name}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-apple-fill text-apple-label-sec border border-apple-border shrink-0">
            {categoryName}
          </span>
          {!product.isActive && (
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-apple-red/10 text-apple-red border border-apple-red/20 shrink-0">
              Inactivo
            </span>
          )}
        </div>
        {product.description && (
          <p className="text-xs text-apple-label-tertiary truncate mt-0.5">{product.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
        <span className="font-bold text-sm text-apple-label tabular-nums">
          {formatPrice(product.price)}
        </span>

        <div className="flex items-center gap-1.5" title="Ajuste rápido de stock">
          <QuickStockAdjuster
            currentStock={product.stock}
            onStockChange={onStockChange}
          />
        </div>

        <label className="relative inline-flex items-center cursor-pointer" title="Activar/Desactivar">
          <input
            type="checkbox"
            checked={product.isActive}
            onChange={onToggleActive}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-apple-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-apple-border after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-apple-green"></div>
        </label>

        <div className="flex items-center gap-1 border-l border-apple-border pl-2">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-apple-label-sec hover:text-apple-label hover:bg-apple-fill rounded-lg transition-colors cursor-pointer"
            title="Editar producto"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-apple-label-sec hover:text-apple-red hover:bg-apple-red/10 rounded-lg transition-colors cursor-pointer"
            title="Eliminar producto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
