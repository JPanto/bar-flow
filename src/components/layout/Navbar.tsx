import React from 'react';
import {
  UtensilsCrossed,
  LayoutGrid,
  CalendarDays,
  Wifi,
  WifiOff,
  Database,
  BellRing,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export type AppTab = 'service' | 'editor' | 'reservations';

interface NavbarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  activeCallsCount?: number;
  highestUrgencyColor?: string;
  onOpenCallsQueue?: () => void;
  onOpenBackup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isOnline,
  pendingSyncCount,
  activeCallsCount = 0,
  highestUrgencyColor = '#34c759',
  onOpenCallsQueue,
  onOpenBackup,
}) => {
  const { user, role, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-apple-card/85 backdrop-blur-xl border-b border-apple-border px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-30 transition-colors">
      {/* Brand & Logo with Apple SF-style layout */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-apple-green flex items-center justify-center text-white shadow-sm shadow-apple-green/30">
          <UtensilsCrossed className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-sm font-black text-apple-label tracking-wide uppercase flex items-center gap-1.5 leading-tight">
            BarFlow <span className="text-[10px] font-semibold lowercase px-1.5 py-0.2 rounded-full bg-apple-green/15 text-apple-green border border-apple-green/30">mvp</span>
          </h1>
          <p className="text-[10px] text-apple-label-sec font-medium leading-none">Gestión de Mesas y Reservas</p>
        </div>
      </div>

      {/* Main Mode Navigation Tabs (Apple Segmented Style) */}
      <nav className="flex items-center gap-1 bg-apple-fill p-1 rounded-2xl border border-apple-border">
        <button
          onClick={() => onSelectTab('service')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.96] touch-manipulation cursor-pointer ${
            currentTab === 'service'
              ? 'bg-apple-green text-white shadow-sm'
              : 'text-apple-label-sec hover:text-apple-label hover:bg-apple-fill'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">En Servicio</span>
        </button>

        {role === 'manager' && (
          <button
            onClick={() => onSelectTab('editor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.96] touch-manipulation cursor-pointer ${
              currentTab === 'editor'
                ? 'bg-apple-blue text-white shadow-sm'
                : 'text-apple-label-sec hover:text-apple-label hover:bg-apple-fill'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editor Croquis</span>
          </button>
        )}

        <button
          onClick={() => onSelectTab('reservations')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.96] touch-manipulation cursor-pointer ${
            currentTab === 'reservations'
              ? 'bg-apple-indigo text-white shadow-sm'
              : 'text-apple-label-sec hover:text-apple-label hover:bg-apple-fill'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reservas</span>
        </button>
      </nav>

      {/* Right Controls & Status */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Dynamic Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-apple-fill hover:bg-apple-fill/80 text-apple-label border border-apple-border transition-all active:scale-[0.96] touch-manipulation cursor-pointer"
          title={resolvedTheme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-apple-yellow animate-in fade-in duration-150" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-apple-indigo animate-in fade-in duration-150" />
          )}
        </button>

        {/* Waiter Calls Bell Notification Trigger */}
        <button
          onClick={onOpenCallsQueue}
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-[0.96] touch-manipulation cursor-pointer ${
            activeCallsCount > 0
              ? 'bg-apple-card border-apple-orange/50 shadow-md shadow-apple-orange/20'
              : 'bg-apple-fill hover:bg-apple-fill/80 border-apple-border text-apple-label-sec hover:text-apple-label'
          }`}
          title="Ver cola de llamados de mesero"
        >
          <BellRing
            className={`w-3.5 h-3.5 ${activeCallsCount > 0 ? 'animate-bounce' : ''}`}
            style={{ color: activeCallsCount > 0 ? highestUrgencyColor : undefined }}
          />
          <span className="hidden md:inline text-apple-label">Llamados</span>
          {activeCallsCount > 0 && (
            <span
              className="px-1.5 py-0.2 rounded-full text-[10px] font-black text-black shadow-sm"
              style={{ backgroundColor: highestUrgencyColor }}
            >
              {activeCallsCount}
            </span>
          )}
        </button>

        {/* Network status pill */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            isOnline
              ? 'bg-apple-green/15 text-apple-green border-apple-green/30'
              : 'bg-apple-orange/15 text-apple-orange border-apple-orange/30'
          }`}
          title={isOnline ? 'Conexión activa' : 'Operando 100% offline'}
        >
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Sync Queue Badge / Data Backup Trigger */}
        <button
          onClick={onOpenBackup}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-apple-fill hover:bg-apple-fill/80 text-apple-label border border-apple-border text-xs font-semibold transition-all active:scale-[0.96] touch-manipulation cursor-pointer"
          title="Copia de seguridad y sincronización"
        >
          <Database className="w-3.5 h-3.5 text-apple-green" />
          <span className="hidden lg:inline">Datos</span>
          {pendingSyncCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-apple-green text-white">
              {pendingSyncCount}
            </span>
          )}
        </button>

        {/* User Session & Role Indicator */}
        {user && (
          <div className="flex items-center gap-2 pl-2 sm:pl-2.5 border-l border-apple-border">
            {/* User Avatar */}
            <div className="flex items-center gap-2" title={`Sesión activa: ${user.email}`}>
              <div className="w-7 h-7 rounded-xl bg-apple-fill border border-apple-border flex items-center justify-center text-apple-label text-xs font-bold shrink-0">
                {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-apple-label max-w-[120px] truncate leading-tight">
                  {user.email}
                </span>
                <span className="text-[10px] text-apple-label-sec font-medium">
                  {role === 'manager' ? 'Gestor' : 'Colaborador'}
                </span>
              </div>
            </div>

            {/* Role Badge */}
            <span
              className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                role === 'manager'
                  ? 'bg-apple-purple/15 text-apple-purple border-apple-purple/30'
                  : 'bg-apple-blue/15 text-apple-blue border-apple-blue/30'
              }`}
            >
              {role === 'manager' ? 'Gestor' : 'Colaborador'}
            </span>

            {/* Logout button */}
            <button
              onClick={() => signOut()}
              className="p-1.5 sm:px-2 sm:py-1 rounded-xl bg-apple-fill hover:bg-apple-red/15 text-apple-label-sec hover:text-apple-red border border-apple-border hover:border-apple-red/30 text-xs font-semibold transition-all active:scale-[0.96] touch-manipulation cursor-pointer flex items-center gap-1.5"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
