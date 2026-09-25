import React from 'react';
import { Product } from '../../types/database';
import { formatPrice } from './ProductCard';
import { Plus, Minus } from 'lucide-react';

export interface FavoritesRankingProps {
  favorites: Product[];
  getQuantityInCart?: (productId: string) => number;
  onAddToCart?: (product: Product) => void;
  onUpdateQuantity?: (quantity: number, product: Product) => void;
}

export const FavoritesRanking: React.FC<FavoritesRankingProps> = ({
  favorites,
  getQuantityInCart = () => 0,
  onAddToCart,
  onUpdateQuantity,
}) => {
  if (!favorites || favorites.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 px-0.5">
        <span className="text-base select-none" role="img" aria-label="Fuego">
          🔥
        </span>
        <h2 className="text-xs font-bold uppercase tracking-wider text-apple-label">
          Los más pedidos
        </h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none snap-x overscroll-x-contain">
        {favorites.map((product, index) => {
          const qty = getQuantityInCart(product.id);
          const isOutOfStock = product.stock <= 0;
          const isMaxReached = qty >= product.stock;

          return (
            <div
              key={product.id}
              className="min-w-[180px] max-w-[200px] shrink-0 bg-apple-card/90 backdrop-blur-sm border border-apple-border rounded-2xl p-3.5 flex flex-col justify-between shadow-sm snap-start relative overflow-hidden transition-all hover:border-apple-green/40"
            >
              <div className="flex items-start justify-between gap-1 mb-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-apple-fill text-[10px] font-black text-apple-label-sec">
                  #{index + 1}
                </span>
                {isOutOfStock ? (
                  <span className="text-[10px] font-bold text-apple-red bg-apple-red/10 px-1.5 py-0.5 rounded-md border border-apple-red/20">
                    Agotado
                  </span>
                ) : product.stock <= 3 ? (
                  <span className="text-[10px] font-semibold text-apple-orange bg-apple-orange/10 px-1.5 py-0.5 rounded-md border border-apple-orange/20">
                    Quedan {product.stock}
                  </span>
                ) : null}
              </div>

              <div className="mb-3">
                <h4 className="font-bold text-apple-label text-xs line-clamp-1 leading-snug">
                  {product.name}
                </h4>
                <p className="text-xs font-black text-apple-label font-mono mt-0.5">
                  {formatPrice(product.price)}
                </p>
              </div>

              <div className="pt-2 border-t border-apple-border/50">
                {isOutOfStock ? (
                  <button
                    disabled
                    className="w-full py-1 text-[11px] font-semibold bg-apple-fill text-apple-label-ter rounded-lg cursor-not-allowed opacity-50"
                  >
                    Agotado
                  </button>
                ) : qty === 0 ? (
                  <button
                    onClick={() => onAddToCart?.(product)}
                    className="w-full py-1 text-[11px] font-bold bg-apple-green text-white rounded-lg shadow-sm hover:bg-apple-green/90 active:scale-95 transition-all touch-manipulation cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Agregar
                  </button>
                ) : (
                  <div className="flex items-center justify-between bg-apple-fill/70 rounded-lg p-0.5 border border-apple-border">
                    <button
                      onClick={() => onUpdateQuantity?.(qty - 1, product)}
                      aria-label="Disminuir"
                      className="w-6 h-6 rounded-md bg-apple-card flex items-center justify-center text-apple-label hover:bg-apple-border active:scale-90 transition-all cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-[11px] text-apple-label font-mono">
                      {qty}
                    </span>
                    <button
                      onClick={() => !isMaxReached && onUpdateQuantity?.(qty + 1, product)}
                      disabled={isMaxReached}
                      aria-label="Aumentar"
                      className={`w-6 h-6 rounded-md bg-apple-card flex items-center justify-center text-apple-label hover:bg-apple-border active:scale-90 transition-all ${
                        isMaxReached ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
