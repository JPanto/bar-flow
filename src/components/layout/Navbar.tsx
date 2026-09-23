import React from 'react';
import {
  UtensilsCrossed,
  LayoutGrid,
  CalendarDays,
  Wifi,
  WifiOff,
  Database,
} from 'lucide-react';

export type AppTab = 'service' | 'editor' | 'reservations';

interface NavbarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onOpenBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isOnline,
  pendingSyncCount,
  onOpenBackup,
}) => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-30">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
          <UtensilsCrossed className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
            BarFlow <span className="text-[10px] font-normal lowercase px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">mvp</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium">Gestión de Mesas y Reservas</p>
        </div>
      </div>

      {/* Main Mode Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
        <button
          onClick={() => onSelectTab('service')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            currentTab === 'service'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span className="hidden sm:inline">En Servicio</span>
        </button>

        <button
          onClick={() => onSelectTab('editor')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            currentTab === 'editor'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">Editor Croquis</span>
        </button>

        <button
          onClick={() => onSelectTab('reservations')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            currentTab === 'reservations'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span className="hidden sm:inline">Reservas</span>
        </button>
      </nav>

      {/* Right status & Backup triggers */}
      <div className="flex items-center gap-2.5">
        {/* Network status */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            isOnline
              ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40'
              : 'bg-amber-950/30 text-amber-400 border-amber-800/40'
          }`}
          title={isOnline ? 'Conexión activa' : 'Operando 100% offline'}
        >
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Sync Queue Badge / Backup button */}
        <button
          onClick={onOpenBackup}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold transition-colors"
          title="Copia de seguridad y sincronización"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Datos</span>
          {pendingSyncCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950">
              {pendingSyncCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
