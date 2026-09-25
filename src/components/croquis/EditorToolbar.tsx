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
    <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20 select-none">
      {/* Left Palette: Add tables */}
      <div className="flex items-center gap-1.5 bg-apple-card/85 backdrop-blur-xl p-1.5 rounded-2xl border border-apple-border shadow-xl pointer-events-auto transition-colors">
        <span className="text-xs font-bold text-apple-label-sec px-2 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5 text-apple-green" /> Agregar:
        </span>

        <button
          onClick={() => onAddTable('round', 4, 90, 90, 'Mesa')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-apple-label bg-apple-fill hover:bg-apple-fill/80 active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
          title="Agregar Mesa Redonda (4 sillas)"
        >
          <Circle className="w-3.5 h-3.5 text-apple-green" />
          <span>Redonda 4p</span>
        </button>

        <button
          onClick={() => onAddTable('round', 2, 70, 70, 'Mesa')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-apple-label bg-apple-fill hover:bg-apple-fill/80 active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
          title="Agregar Mesa Redonda (2 sillas)"
        >
          <Circle className="w-3.5 h-3.5 text-apple-green" />
          <span>Redonda 2p</span>
        </button>

        <button
          onClick={() => onAddTable('square', 4, 95, 95, 'Mesa')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-apple-label bg-apple-fill hover:bg-apple-fill/80 active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
          title="Agregar Mesa Cuadrada (4 sillas)"
        >
          <Square className="w-3.5 h-3.5 text-apple-blue" />
          <span>Cuadrada 4p</span>
        </button>

        <button
          onClick={() => onAddTable('rectangle', 6, 180, 95, 'Mesa')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-apple-label bg-apple-fill hover:bg-apple-fill/80 active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
          title="Agregar Mesa Rectangular (6 sillas)"
        >
          <RectangleHorizontal className="w-3.5 h-3.5 text-apple-indigo" />
          <span>Rectangular 6p</span>
        </button>

        <button
          onClick={() => onAddTable('counter', 4, 320, 55, 'Barra')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-apple-label bg-apple-fill hover:bg-apple-fill/80 active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
          title="Agregar Barra con taburetes"
        >
          <Beer className="w-3.5 h-3.5 text-apple-orange" />
          <span>Barra</span>
        </button>
      </div>

      {/* Right Controls: Magnet Grid + Selection Actions */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Selected table actions */}
        {selectedTable && (
          <div className="flex items-center gap-1 bg-apple-card/85 backdrop-blur-xl p-1.5 rounded-2xl border border-apple-blue/40 shadow-xl animate-in fade-in duration-150">
            <span className="text-xs font-bold text-apple-blue px-2">
              {selectedTable.name}
            </span>
            <button
              onClick={onOpenInspector}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-apple-label bg-apple-fill hover:bg-apple-fill/80 active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
              title="Editar propiedades de mesa"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Propiedades</span>
            </button>
            <button
              onClick={onDeleteSelected}
              className="p-1.5 text-apple-red hover:bg-apple-red/15 active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
              title="Eliminar mesa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Snap-to-grid toggle */}
        <button
          onClick={onToggleSnap}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-2xl border backdrop-blur-xl shadow-xl transition-all active:scale-[0.96] touch-manipulation cursor-pointer ${
            snapToGrid
              ? 'bg-apple-green/15 border-apple-green/40 text-apple-green shadow-sm'
              : 'bg-apple-card/85 border-apple-border text-apple-label-sec hover:text-apple-label'
          }`}
          title="Rejilla Magnética (Snap-to-Grid 20px)"
        >
          <Magnet className={`w-4 h-4 ${snapToGrid ? 'text-apple-green' : 'text-apple-label-sec'}`} />
          <span>Rejilla 20px {snapToGrid ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
};
