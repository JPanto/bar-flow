import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { ProductCategory } from '../../types/database';

export interface CategoryFormModalProps {
  isOpen: boolean;
  category?: ProductCategory | null;
  onClose: () => void;
  onSave: (data: { id?: string; name: string; sortOrder: number }) => Promise<void> | void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  category,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setSortOrder(category.sortOrder ?? 0);
    } else {
      setName('');
      setSortOrder(0);
    }
    setError(null);
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        id: category?.id,
        name: trimmedName,
        sortOrder: Number(sortOrder) || 0,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la categoría.');
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
        className="w-full max-w-md bg-apple-card border border-apple-border rounded-2xl p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-apple-border">
          <div className="flex items-center gap-2 text-apple-label">
            <div className="w-8 h-8 rounded-xl bg-apple-blue/15 text-apple-blue flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold">
              {category ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-apple-label-sec hover:text-apple-label hover:bg-apple-fill transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 text-xs text-apple-red bg-apple-red/10 border border-apple-red/20 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-apple-label-sec mb-1">
              Nombre de la categoría *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Cervezas, Cócteles, Hamburguesas"
              className="w-full px-3.5 py-2.5 bg-apple-fill border border-apple-border rounded-xl text-apple-label placeholder:text-apple-label-tertiary focus:outline-none focus:ring-2 focus:ring-apple-blue/40 text-sm font-medium"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-apple-label-sec mb-1">
              Orden de visualización
            </label>
            <input
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-full px-3.5 py-2.5 bg-apple-fill border border-apple-border rounded-xl text-apple-label focus:outline-none focus:ring-2 focus:ring-apple-blue/40 text-sm font-medium"
            />
            <p className="text-[11px] text-apple-label-tertiary mt-1">
              Menor número se mostrará primero en el menú.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-apple-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-apple-label-sec hover:bg-apple-fill transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-apple-blue text-white hover:bg-apple-blue/90 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting ? 'Guardando...' : category ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
