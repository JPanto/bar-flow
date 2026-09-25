import React, { useState, useEffect } from 'react';
import { TableElement, TableShape } from '../../types/database';
import { X, Check, Trash2, Users } from 'lucide-react';

interface TableInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableElement | null;
  onSave: (tableId: string, changes: Partial<TableElement>) => void;
  onDelete: (tableId: string) => void;
}

export const TableInspectorModal: React.FC<TableInspectorModalProps> = ({
  isOpen,
  onClose,
  table,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !table) return null;

  const [name, setName] = useState(table.name);
  const [seats, setSeats] = useState(table.seats);
  const [shape, setShape] = useState<TableShape>(table.shape);
  const [width, setWidth] = useState(table.width);
  const [height, setHeight] = useState(table.height);
  const [rotation, setRotation] = useState(table.rotation);

  useEffect(() => {
    if (table) {
      setName(table.name);
      setSeats(table.seats);
      setShape(table.shape);
      setWidth(table.width);
      setHeight(table.height);
      setRotation(table.rotation);
    }
  }, [table]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(table.id, {
      name,
      seats: Number(seats),
      shape,
      width: Number(width),
      height: Number(height),
      rotation: Number(rotation),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-apple-card border border-apple-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-apple-border">
          <div>
            <h3 className="text-base font-bold text-apple-label">Propiedades de Mesa</h3>
            <p className="text-xs text-apple-label-sec">Personaliza dimensiones y asientos</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-apple-label-sec hover:text-apple-label hover:bg-apple-fill active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-apple-label mb-1.5">
              Nombre / Código de Mesa
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-apple-fill border border-apple-border rounded-xl px-3.5 py-2.5 text-apple-label text-sm focus:outline-none focus:border-apple-green transition-colors"
              placeholder="Ej. Mesa 12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-apple-label mb-1.5">
                Capacidad (Sillas)
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-apple-label-sec absolute left-3.5 top-3" />
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  required
                  className="w-full bg-apple-fill border border-apple-border rounded-xl pl-10 pr-3 py-2.5 text-apple-label text-sm focus:outline-none focus:border-apple-green"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-apple-label mb-1.5">
                Forma
              </label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as TableShape)}
                className="w-full bg-apple-fill border border-apple-border rounded-xl px-3 py-2.5 text-apple-label text-sm focus:outline-none focus:border-apple-green"
              >
                <option value="round">Redonda</option>
                <option value="square">Cuadrada</option>
                <option value="rectangle">Rectangular</option>
                <option value="counter">Barra / Mostrador</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-apple-label-sec mb-1">Ancho (px)</label>
              <input
                type="number"
                min={40}
                max={800}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full bg-apple-fill border border-apple-border rounded-xl px-3 py-2 text-apple-label text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-apple-label-sec mb-1">Alto (px)</label>
              <input
                type="number"
                min={40}
                max={800}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full bg-apple-fill border border-apple-border rounded-xl px-3 py-2 text-apple-label text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-apple-label-sec mb-1">Rotación (°)</label>
              <input
                type="number"
                min={0}
                max={360}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full bg-apple-fill border border-apple-border rounded-xl px-3 py-2 text-apple-label text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-apple-border">
            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Eliminar ${table.name} del plano?`)) {
                  onDelete(table.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-apple-red hover:bg-apple-red/10 rounded-xl transition-all active:scale-[0.96] touch-manipulation cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Mesa
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-apple-label-sec hover:text-apple-label hover:bg-apple-fill rounded-xl transition-all active:scale-[0.96] touch-manipulation cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-apple-green hover:opacity-95 active:scale-[0.96] rounded-xl shadow-sm transition-all touch-manipulation cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
