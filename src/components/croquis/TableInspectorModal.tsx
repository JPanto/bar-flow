import React, { useState, useEffect } from 'react';
import { TableElement, TableShape } from '../../types/database';
import { X, Trash2, Check, Users } from 'lucide-react';

interface TableInspectorModalProps {
  table: TableElement | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (tableId: string, updates: Partial<TableElement>) => void;
  onDelete: (tableId: string) => void;
}

export const TableInspectorModal: React.FC<TableInspectorModalProps> = ({
  table,
  isOpen,
  onClose,
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
    setName(table.name);
    setSeats(table.seats);
    setShape(table.shape);
    setWidth(table.width);
    setHeight(table.height);
    setRotation(table.rotation);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Propiedades de Mesa</h3>
            <p className="text-xs text-slate-400">Personaliza dimensiones y asientos</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Nombre / Código de Mesa
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="Ej. Mesa 12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Capacidad (Sillas)
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Forma
              </label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as TableShape)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-500"
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
              <label className="block text-xs font-semibold text-slate-400 mb-1">Ancho (px)</label>
              <input
                type="number"
                min={40}
                max={800}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Alto (px)</label>
              <input
                type="number"
                min={40}
                max={800}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Rotación (°)</label>
              <input
                type="number"
                min={0}
                max={360}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                if (confirm(`¿Eliminar ${table.name} del plano?`)) {
                  onDelete(table.id);
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Mesa
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl shadow-lg shadow-emerald-950 transition-all"
              >
                <Check className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
