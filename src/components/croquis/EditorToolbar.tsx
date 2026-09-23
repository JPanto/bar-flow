import React from 'react';
import { TableShape, TableElement } from '../../types/database';
import {
  Circle,
  Square,
  RectangleHorizontal,
  Beer,
  Magnet,
  Trash2,
  Sliders,
  Plus,
} from 'lucide-react';

interface EditorToolbarProps {
  onAddTable: (shape: TableShape, seats: number, width: number, height: number, namePrefix: string) => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  selectedTable: TableElement | null;
  onOpenInspector: () => void;
  onDeleteSelected: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onAddTable,
  snapToGrid,
  onToggleSnap,
  selectedTable,
  onOpenInspector,
  onDeleteSelected,
}) => {
  return (
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
      {/* Left Palette: Add tables */}
      <div className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-2xl pointer-events-auto">
        <span className="text-xs font-bold text-slate-400 px-2 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5 text-emerald-400" /> Agregar:
        </span>

        <button
          onClick={() => onAddTable('round', 4, 90, 90, 'Mesa')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 active:scale-95 rounded-xl transition-all"
          title="Agregar Mesa Redonda (4 sillas)"
        >
          <Circle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Redonda 4p</span>
        </button>

        <button
          onClick={() => onAddTable('round', 2, 70, 70, 'Mesa')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 active:scale-95 rounded-xl transition-all"
          title="Agregar Mesa Redonda (2 sillas)"
        >
          <Circle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Redonda 2p</span>
        </button>

        <button
          onClick={() => onAddTable('square', 4, 95, 95, 'Mesa')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 active:scale-95 rounded-xl transition-all"
          title="Agregar Mesa Cuadrada (4 sillas)"
        >
          <Square className="w-3.5 h-3.5 text-blue-400" />
          <span>Cuadrada 4p</span>
        </button>

        <button
          onClick={() => onAddTable('rectangle', 6, 180, 95, 'Mesa')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 active:scale-95 rounded-xl transition-all"
          title="Agregar Mesa Rectangular (6 sillas)"
        >
          <RectangleHorizontal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Rectangular 6p</span>
        </button>

        <button
          onClick={() => onAddTable('counter', 4, 320, 55, 'Barra')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 active:scale-95 rounded-xl transition-all"
          title="Agregar Barra con taburetes"
        >
          <Beer className="w-3.5 h-3.5 text-amber-400" />
          <span>Barra</span>
        </button>
      </div>

      {/* Right Controls: Magnet Grid + Selection Actions */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Selected table actions */}
        {selectedTable && (
          <div className="flex items-center gap-1 bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-sky-500/40 shadow-2xl animate-in fade-in duration-150">
            <span className="text-xs font-semibold text-sky-400 px-2">
              {selectedTable.name}
            </span>
            <button
              onClick={onOpenInspector}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              title="Editar propiedades de mesa"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Propiedades</span>
            </button>
            <button
              onClick={onDeleteSelected}
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-xl transition-colors"
              title="Eliminar mesa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Snap-to-grid toggle */}
        <button
          onClick={onToggleSnap}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-2xl border backdrop-blur-md shadow-2xl transition-all active:scale-95 ${
            snapToGrid
              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-emerald-950/50'
              : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Rejilla Magnética (Snap-to-Grid 20px)"
        >
          <Magnet className={`w-4 h-4 ${snapToGrid ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span>Rejilla 20px {snapToGrid ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};
