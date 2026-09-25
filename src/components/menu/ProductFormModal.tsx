import React, { useState, useEffect } from 'react';
import { X, PackagePlus, DollarSign } from 'lucide-react';
import { Product, ProductCategory } from '../../types/database';

export interface ProductFormModalProps {
  isOpen: boolean;
  product?: Product | null;
  categories: ProductCategory[];
  onClose: () => void;
  onSave: (data: {
    id?: string;
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    stock: number;
    isActive: boolean;
  }) => Promise<void> | void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  product,
  categories,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number | ''>(0);
  const [stock, setStock] = useState<number | ''>(10);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setCategoryId(product.categoryId || categories[0]?.id || '');
      setPrice(product.price ?? 0);
      setStock(product.stock ?? 0);
      setIsActive(product.isActive !== false);
    } else {
      setName('');
      setDescription('');
      setCategoryId(categories[0]?.id || '');
      setPrice('');
      setStock(10);
      setIsActive(true);
    }
    setError(null);
  }, [product, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return setError('El nombre del producto es obligatorio.');
    if (!categoryId) return setError('Debes seleccionar una categoría.');
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) return setError('Precio debe ser mayor o igual a 0.');
    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) return setError('Stock debe ser mayor o igual a 0.');

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        id: product?.id,
        name: trimmedName,
        description: description.trim(),
        categoryId,
        price: numPrice,
        stock: numStock,
        isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-apple-card border border-apple-border rounded-2xl p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-apple-border">
          <div className="flex items-center gap-2 text-apple-label">
            <div className="w-8 h-8 rounded-xl bg-apple-green/15 text-apple-green flex items-center justify-center font-bold">
              <PackagePlus className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold">{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg text-apple-label-sec hover:text-apple-label hover:bg-apple-fill transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && <div className="p-3 text-xs text-apple-red bg-apple-red/10 border border-apple-red/20 rounded-xl">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-apple-label-sec mb-1">Nombre *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Hamburguesa Clásica, Gin Tonic"
              className="w-full px-3.5 py-2.5 bg-apple-fill border border-apple-border rounded-xl text-apple-label placeholder:text-apple-label-tertiary focus:outline-none focus:ring-2 focus:ring-apple-green/40 text-sm font-medium"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-apple-label-sec mb-1">Categoría *</label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-apple-fill border border-apple-border rounded-xl text-apple-label focus:outline-none focus:ring-2 focus:ring-apple-green/40 text-sm font-medium cursor-pointer"
            >
              {categories.length === 0 && <option value="">Sin categorías</option>}
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-apple-label-sec mb-1">Descripción</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Carne 200g, queso cheddar, cebolla caramelizada"
              className="w-full px-3.5 py-2 bg-apple-fill border border-apple-border rounded-xl text-apple-label placeholder:text-apple-label-tertiary focus:outline-none focus:ring-2 focus:ring-apple-green/40 text-sm font-medium resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-apple-label-sec mb-1">Precio *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-apple-label-tertiary">
                  <DollarSign className="w-3.5 h-3.5" />
                </span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-apple-fill border border-apple-border rounded-xl text-apple-label focus:outline-none focus:ring-2 focus:ring-apple-green/40 text-sm font-semibold tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-apple-label-sec mb-1">Stock inicial *</label>
              <input
                type="number"
                min={0}
                required
                value={stock}
                onChange={(e) => setStock(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))}
                placeholder="10"
                className="w-full px-3.5 py-2.5 bg-apple-fill border border-apple-border rounded-xl text-apple-label focus:outline-none focus:ring-2 focus:ring-apple-green/40 text-sm font-semibold tabular-nums"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-apple-fill/50 border border-apple-border/50 rounded-xl">
            <div>
              <span className="block text-xs font-semibold text-apple-label">Visible en el Menú</span>
              <span className="block text-[11px] text-apple-label-tertiary">Los clientes podrán ordenar este producto</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-apple-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-apple-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-apple-green"></div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-apple-border">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-xl text-apple-label-sec hover:bg-apple-fill transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !categoryId}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-apple-green text-white hover:bg-apple-green/90 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {isSubmitting ? 'Guardando...' : product ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
