import React, { useState } from 'react';
import { Zone } from '../../types/database';
import { Layers, Plus, X, Check } from 'lucide-react';

interface ZoneTabsProps {
  zones: Zone[];
  activeZoneId: string;
  onSelectZone: (zoneId: string) => void;
  onCreateZone: (name: string) => void;
  isEditorMode: boolean;
}

export const ZoneTabs: React.FC<ZoneTabsProps> = ({
  zones,
  activeZoneId,
  onSelectZone,
  onCreateZone,
  isEditorMode,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    onCreateZone(newZoneName.trim());
    setNewZoneName('');
    setIsAdding(false);
  };

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 text-slate-500 font-semibold uppercase tracking-wider mr-2 text-[10px]">
        <Layers className="w-3.5 h-3.5" /> Ambientes:
      </div>

      {zones.map((zone) => {
        const isActive = zone.id === activeZoneId;
        return (
          <button
            key={zone.id}
            onClick={() => onSelectZone(zone.id)}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all ${
              isActive
                ? 'bg-slate-800 text-emerald-400 font-semibold shadow-inner border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {zone.name}
          </button>
        );
      })}

      {isEditorMode && (
        <>
          {isAdding ? (
            <form onSubmit={handleCreate} className="flex items-center gap-1">
              <input
                type="text"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="Nombre del ambiente..."
                autoFocus
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 w-36"
              />
              <button
                type="submit"
                className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-dashed border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Ambiente</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
