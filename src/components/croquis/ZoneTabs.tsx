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
    <div className="flex items-center gap-1.5 px-4 py-2 bg-apple-card/60 backdrop-blur-md border-b border-apple-border text-xs overflow-x-auto no-scrollbar transition-colors">
      <div className="flex items-center gap-1 text-apple-label-sec font-semibold uppercase tracking-wider mr-2 text-[10px]">
        <Layers className="w-3.5 h-3.5" /> Ambientes:
      </div>

      {zones.map((zone) => {
        const isActive = zone.id === activeZoneId;
        return (
          <button
            key={zone.id}
            onClick={() => onSelectZone(zone.id)}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all active:scale-[0.96] touch-manipulation cursor-pointer ${
              isActive
                ? 'bg-apple-fill text-apple-label font-bold border border-apple-border shadow-sm'
                : 'text-apple-label-sec hover:text-apple-label hover:bg-apple-fill/50'
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
                className="bg-apple-fill border border-apple-border rounded-xl px-2.5 py-1 text-xs text-apple-label placeholder:text-apple-label-ter focus:outline-none focus:border-apple-green w-36"
              />
              <button
                type="submit"
                className="p-1 bg-apple-green hover:opacity-95 text-white rounded-lg active:scale-[0.96] cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="p-1 text-apple-label-sec hover:text-apple-label cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-apple-label-sec hover:text-apple-label hover:bg-apple-fill border border-dashed border-apple-border transition-all active:scale-[0.96] touch-manipulation cursor-pointer"
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
