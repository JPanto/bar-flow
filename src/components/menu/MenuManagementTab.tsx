import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Package,
  Plus,
  Search,
  Tag,
  AlertTriangle,
  Flame,
  Sparkles,
} from 'lucide-react';
import { db } from '../../db';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  createProductCategory,
  updateProductCategory,
  updateAppSetting,
} from '../../db';
import { Product, ProductCategory } from '../../types/database';
import { syncService } from '../../services/syncService';
import { ProductListItem } from './ProductListItem';
import { ProductFormModal } from './ProductFormModal';
import { CategoryFormModal } from './CategoryFormModal';

export const MenuManagementTab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);

  const rawProducts = useLiveQuery(() => db.products.toArray()) || [];
  const rawCategories = useLiveQuery(() => db.product_categories.toArray()) || [];
  const settings = useLiveQuery(() => db.app_settings.get('show_favorites_ranking'));
  const showFavoritesRanking = settings ? Boolean(settings.value) : true;

  const categories = useMemo(() => {
    return [...rawCategories].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [rawCategories]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.name]));
  }, [categories]);

  const activeProducts = useMemo(() => rawProducts.filter((p) => p.isActive), [rawProducts]);
  const lowStockCount = useMemo(() => rawProducts.filter((p) => p.stock > 0 && p.stock <= 5).length, [rawProducts]);
  const outOfStockCount = useMemo(() => rawProducts.filter((p) => p.stock === 0).length, [rawProducts]);
  const topSeller = useMemo(() => {
    const sorted = [...rawProducts].filter((p) => (p.totalOrders || 0) > 0).sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0));
    return sorted[0] || null;
  }, [rawProducts]);

  const filteredProducts = useMemo(() => {
    let prods = rawProducts;
    if (selectedCategory !== 'all') {
      prods = prods.filter((p) => p.categoryId === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      prods = prods.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return prods.sort((a, b) => a.name.localeCompare(b.name));
  }, [rawProducts, selectedCategory, searchQuery]);

  const handleStockChange = async (productId: string, newStock: number) => {
    await updateProductStock(db, productId, newStock);
    syncService.triggerSync();
  };

  const handleToggleActive = async (product: Product) => {
    await updateProduct(db, product.id, { isActive: !product.isActive });
    syncService.triggerSync();
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`¿Eliminar producto "${product.name}"?`)) {
      await deleteProduct(db, product.id);
      syncService.triggerSync();
    }
  };

  const handleToggleFavorites = async (enabled: boolean) => {
    await updateAppSetting(db, 'show_favorites_ranking', enabled);
    syncService.triggerSync();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-apple-bg overflow-y-auto p-4 sm:p-6 space-y-5">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-apple-border">
        <div>
          <h2 className="text-xl font-black text-apple-label flex items-center gap-2">
            <Package className="w-5 h-5 text-apple-green" />
            Gestión de Menú y Stock
          </h2>
          <p className="text-xs text-apple-label-sec">
            Administra productos, ajusta existencias al instante y controla el catálogo visible.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-2 bg-apple-card border border-apple-border px-3 py-1.5 rounded-xl cursor-pointer select-none">
            <Sparkles className="w-3.5 h-3.5 text-apple-yellow" />
            <span className="text-xs font-semibold text-apple-label">Ranking Top 5</span>
            <input
              type="checkbox"
              checked={showFavoritesRanking}
              onChange={(e) => handleToggleFavorites(e.target.checked)}
              className="accent-apple-green cursor-pointer"
            />
          </label>

          <button
            type="button"
            onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-apple-fill hover:bg-apple-card text-apple-label border border-apple-border rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5 text-apple-blue" />
            <span>+ Nueva Categoría</span>
          </button>

          <button
            type="button"
            onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-apple-green text-white hover:bg-apple-green/90 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm shadow-apple-green/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Quick KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-apple-card border border-apple-border rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-apple-label-sec">Productos Activos</span>
          <span className="text-2xl font-black text-apple-label mt-1">{activeProducts.length}</span>
        </div>
        <div className="bg-apple-card border border-apple-border rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-apple-orange flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Stock Bajo (≤ 5)
          </span>
          <span className="text-2xl font-black text-apple-orange mt-1">{lowStockCount}</span>
        </div>
        <div className="bg-apple-card border border-apple-border rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-apple-red">Agotados (0)</span>
          <span className="text-2xl font-black text-apple-red mt-1">{outOfStockCount}</span>
        </div>
        <div className="bg-apple-card border border-apple-border rounded-2xl p-3.5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-apple-label-sec flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-apple-orange" /> Más Vendido
          </span>
          <span className="text-xs font-bold text-apple-label truncate mt-1" title={topSeller ? `${topSeller.name} (${topSeller.totalOrders})` : 'Ninguno'}>
            {topSeller ? `${topSeller.name} (${topSeller.totalOrders})` : 'Ninguno aún'}
          </span>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-apple-label text-apple-bg shadow-xs'
                : 'bg-apple-fill text-apple-label-sec hover:text-apple-label'
            }`}
          >
            Todos ({rawProducts.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-apple-label text-apple-bg shadow-xs'
                  : 'bg-apple-fill text-apple-label-sec hover:text-apple-label'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="relative sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-apple-label-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-apple-card border border-apple-border rounded-xl text-apple-label placeholder:text-apple-label-tertiary text-xs font-medium focus:outline-none focus:ring-2 focus:ring-apple-green/40"
          />
        </div>
      </div>

      {/* Product List / Table */}
      <div className="bg-apple-card border border-apple-border rounded-2xl overflow-hidden shadow-xs">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-apple-label-sec">
            <Package className="w-8 h-8 mx-auto text-apple-label-tertiary mb-2" />
            <p className="text-sm font-semibold">No se encontraron productos</p>
            <p className="text-xs text-apple-label-tertiary mt-1">Crea tu primer producto para comenzar.</p>
          </div>
        ) : (
          <div className="divide-y divide-apple-border">
            {filteredProducts.map((prod) => (
              <ProductListItem
                key={prod.id}
                product={prod}
                categoryName={categoryMap.get(prod.categoryId) || 'Sin categoría'}
                onStockChange={(newStock) => handleStockChange(prod.id, newStock)}
                onToggleActive={() => handleToggleActive(prod)}
                onEdit={() => { setEditingProduct(prod); setIsProductModalOpen(true); }}
                onDelete={() => handleDeleteProduct(prod)}
              />
            ))}
          </div>
        )}
      </div>

      <ProductFormModal
        isOpen={isProductModalOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
        onSave={async (data) => {
          if (data.id) {
            await updateProduct(db, data.id, data);
          } else {
            await createProduct(db, data);
          }
          syncService.triggerSync();
        }}
      />

      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        category={editingCategory}
        onClose={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }}
        onSave={async (data) => {
          if (data.id) {
            await updateProductCategory(db, data.id, data);
          } else {
            await createProductCategory(db, data);
          }
          syncService.triggerSync();
        }}
      />
    </div>
  );
};
