import React from 'react';
import { Product } from '../../types/database';
import { Plus, Minus, AlertTriangle } from 'lucide-react';

export interface ProductCardProps {
  product: Product;
  quantityInCart?: number;
  onAddToCart?: (product?: Product) => void;
  onUpdateQuantity?: (newQuantity: number, product?: Product) => void;
}

export const formatPrice = (price: number): string => {
  return `$${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart = 0,
  onAddToCart,
  onUpdateQuantity,
}) => {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 3;
  const isMaxReached = quantityInCart >= product.stock;

  return (
    <div className="bg-apple-card/90 backdrop-blur-md border border-apple-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:border-apple-green/40 transition-all">
      <div className="space-y-1.5 mb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-apple-label text-base leading-snug">
            {product.name}
          </h3>
          {isLowStock ? (
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-apple-orange/10 text-apple-orange border border-apple-orange/20">
              <AlertTriangle className="w-3 h-3" />
              Últimas {product.stock} unidades
            </span>
          ) : null}
        </div>

        {product.description ? (
          <p className="text-xs text-apple-label-sec leading-relaxed line-clamp-2">
            {product.description}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-apple-border/50 mt-auto">
        <span className="text-base sm:text-lg font-black text-apple-label font-mono">
          {formatPrice(product.price)}
        </span>

        {isOutOfStock ? (
          <button
            disabled
            className="px-3.5 py-1.5 rounded-xl bg-apple-fill text-apple-label-ter text-xs font-semibold cursor-not-allowed opacity-60"
          >
            Agotado
          </button>
        ) : quantityInCart === 0 ? (
          <button
            onClick={() => onAddToCart?.(product)}
            className="px-4 py-2 bg-apple-green text-white text-xs font-bold rounded-xl shadow-sm hover:bg-apple-green/90 active:scale-95 transition-all touch-manipulation cursor-pointer"
          >
            Agregar
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-apple-fill/70 rounded-xl p-1 border border-apple-border">
            <button
              onClick={() => onUpdateQuantity?.(quantityInCart - 1, product)}
              aria-label="Disminuir cantidad"
              className="w-7 h-7 rounded-lg bg-apple-card flex items-center justify-center text-apple-label hover:bg-apple-border active:scale-90 transition-all cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="min-w-5 text-center font-bold text-xs text-apple-label font-mono">
              {quantityInCart}
            </span>
            <button
              onClick={() => !isMaxReached && onUpdateQuantity?.(quantityInCart + 1, product)}
              disabled={isMaxReached}
              aria-label="Aumentar cantidad"
              className={`w-7 h-7 rounded-lg bg-apple-card flex items-center justify-center text-apple-label hover:bg-apple-border active:scale-90 transition-all ${
                isMaxReached ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
