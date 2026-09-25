import React, { useState, useEffect, useMemo } from 'react';
import { useCustomerMenu } from '../../hooks/useCustomerMenu';
import { useOrderManagement } from '../../hooks/useOrderManagement';
import { Product, ProductOrder } from '../../types/database';
import { ProductCard } from './ProductCard';
import { FavoritesRanking } from './FavoritesRanking';
import { OrderCartDrawer, CartItem } from './OrderCartDrawer';
import { Search, X, Utensils, AlertCircle } from 'lucide-react';

export interface CustomerMenuProps {
  tableId: string;
  sessionId?: string;
  tableName?: string;
  sessionWord?: string;
  onOrderSuccess?: (order: ProductOrder) => void;
}

export const CustomerMenu: React.FC<CustomerMenuProps> = ({
  tableId,
  sessionId,
  tableName,
  sessionWord,
  onOrderSuccess,
}) => {
  const {
    categories,
    products,
    favorites,
    showFavoritesRanking,
    selectedCategoryId,
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    isLoading,
  } = useCustomerMenu();

  const { createOrder, isProcessing } = useOrderManagement();

  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [cartMap, setCartMap] = useState<Map<string, CartItem>>(new Map());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Debounced search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, setSearchQuery]);

  const cartItems = useMemo(() => Array.from(cartMap.values()), [cartMap]);

  const getQuantityInCart = (productId: string): number => {
    return cartMap.get(productId)?.quantity || 0;
  };

  const handleAddToCart = (product?: Product) => {
    if (!product || product.stock <= 0) return;
    setCartMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(product.id);
      const newQty = existing ? Math.min(existing.quantity + 1, product.stock) : 1;
      next.set(product.id, {
        product,
        quantity: newQty,
        notes: existing?.notes || '',
      });
      return next;
    });
  };

  const handleUpdateQuantity = (newQty: number, product?: Product) => {
    if (!product) return;
    setCartMap((prev) => {
      const next = new Map(prev);
      if (newQty <= 0) {
        next.delete(product.id);
      } else {
        const clampedQty = Math.min(newQty, product.stock);
        const existing = next.get(product.id);
        next.set(product.id, {
          product,
          quantity: clampedQty,
          notes: existing?.notes || '',
        });
      }
      return next;
    });
  };

  const handleUpdateNotes = (productId: string, notes: string) => {
    setCartMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(productId);
      if (existing) {
        next.set(productId, { ...existing, notes });
      }
      return next;
    });
  };

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0 || !sessionId) {
      if (!sessionId) {
        setOrderError('No hay una sesión activa de mesa para registrar el pedido.');
      }
      return;
    }
    setOrderError(null);
    try {
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
      const newOrder = await createOrder({
        tableId,
        sessionId,
        tableName: tableName || 'Mesa',
        sessionWord: sessionWord || 'MESA',
        totalAmount,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          unitPrice: item.product.price,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
      });

      setCartMap(new Map());
      setIsCartOpen(false);
      onOrderSuccess?.(newOrder);
    } catch (err: any) {
      setOrderError(err?.message || 'Error al enviar el pedido a la mesa.');
    }
  };

  return (
    <div className="w-full space-y-4 pb-24">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-apple-label-ter absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar bebidas, platos, cócteles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-apple-card border border-apple-border rounded-2xl pl-10 pr-9 py-2.5 text-xs text-apple-label placeholder:text-apple-label-ter outline-none focus:border-apple-green/50 transition-colors"
        />
        {searchTerm.length > 0 && (
          <button
            onClick={() => setSearchTerm('')}
            aria-label="Limpiar búsqueda"
            className="w-5 h-5 rounded-full bg-apple-fill text-apple-label-sec absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center hover:text-apple-label"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Category Pills Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none snap-x">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all snap-start cursor-pointer ${
            selectedCategoryId === null
              ? 'bg-apple-green text-white shadow-sm shadow-apple-green/20 font-bold'
              : 'bg-apple-card border border-apple-border text-apple-label-sec hover:text-apple-label'
          }`}
        >
          Todas
        </button>
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all snap-start cursor-pointer ${
                isSelected
                  ? 'bg-apple-green text-white shadow-sm shadow-apple-green/20 font-bold'
                  : 'bg-apple-card border border-apple-border text-apple-label-sec hover:text-apple-label'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Order Submission Error Banner */}
      {orderError && (
        <div className="p-3 rounded-2xl bg-apple-red/10 border border-apple-red/20 text-apple-red text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{orderError}</span>
        </div>
      )}

      {/* Favorites Ranking (shown only when browsing all categories and no active search) */}
      {showFavoritesRanking && !selectedCategoryId && !searchTerm && (
        <FavoritesRanking
          favorites={favorites}
          getQuantityInCart={getQuantityInCart}
          onAddToCart={handleAddToCart}
          onUpdateQuantity={handleUpdateQuantity}
        />
      )}

      {/* Product List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-apple-label-sec text-xs">
            Cargando menú...
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center bg-apple-card/60 rounded-2xl border border-apple-border/60 p-6 space-y-2">
            <Utensils className="w-8 h-8 text-apple-label-ter mx-auto opacity-60" />
            <h3 className="font-bold text-sm text-apple-label">No hay productos disponibles</h3>
            <p className="text-xs text-apple-label-sec">
              {searchTerm
                ? 'No encontramos coincidencias para tu búsqueda.'
                : 'No hay productos en esta categoría.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantityInCart={getQuantityInCart(product.id)}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Cart Drawer */}
      <OrderCartDrawer
        items={cartItems}
        isOpen={isCartOpen}
        onOpen={() => setIsCartOpen(true)}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onUpdateNotes={handleUpdateNotes}
        onSubmitOrder={handleSubmitOrder}
        isSubmitting={isProcessing}
      />
    </div>
  );
};
