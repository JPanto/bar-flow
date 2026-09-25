import React from 'react';
import {
  UtensilsCrossed,
  LayoutGrid,
  CalendarDays,
  BellRing,
  Sun,
  Moon,
  Menu,
  User as UserIcon,
  Package,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export type AppTab = 'service' | 'editor' | 'reservations' | 'menu';

interface NavbarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  activeCallsCount?: number;
  highestUrgencyColor?: string;
  onOpenCallsQueue?: () => void;
  onOpenBackup: () => void;
  onOpenMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeCallsCount = 0,
  highestUrgencyColor = '#34c759',
  onOpenCallsQueue,
  onOpenMenu,
}) => {
  const { user, role } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <header className="h-14 sm:h-16 bg-apple-card/85 backdrop-blur-xl border-b border-apple-border px-3 sm:px-6 flex items-center justify-between shrink-0 select-none z-30 transition-colors">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-apple-green flex items-center justify-center text-white shadow-sm shadow-apple-green/30 shrink-0">
          <UtensilsCrossed className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-xs sm:text-sm font-black text-apple-label tracking-wide uppercase flex items-center gap-1.5 leading-tight">
            BarFlow <span className="text-[9px] sm:text-[10px] font-semibold lowercase px-1.5 py-0.2 rounded-full bg-apple-green/15 text-apple-green border border-apple-green/30">mvp</span>
          </h1>
          <p className="text-[9px] sm:text-[10px] text-apple-label-sec font-medium leading-none hidden xs:block">
            Mesas & Reservas
          </p>
        </div>
      </div>

      {/* Main Mode Navigation Tabs (Segmented Control) */}
      <nav className="flex items-center gap-1 bg-apple-fill p-1 rounded-2xl border border-apple-border">
        <button
          onClick={() => onSelectTab('service')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.96] touch-manipulation cursor-pointer ${
            currentTab === 'service'
              ? 'bg-apple-green text-white shadow-sm'
              : 'text-apple-label-sec hover:text-apple-label'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">En Servicio</span>
        </button>

        {role === 'manager' && (
          <button
            onClick={() => onSelectTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.96] touch-manipulation cursor-pointer ${
              currentTab === 'editor'
                ? 'bg-apple-blue text-white shadow-sm'
                : 'text-apple-label-sec hover:text-apple-label'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editor Croquis</span>
          </button>
        )}

        {role === 'manager' && (
          <button
            onClick={() => onSelectTab('menu')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.96] touch-manipulation cursor-pointer ${
              currentTab === 'menu'
                ? 'bg-apple-purple text-white shadow-sm'
                : 'text-apple-label-sec hover:text-apple-label'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Menú</span>
          </button>
        )}

        <button
          onClick={() => onSelectTab('reservations')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.96] touch-manipulation cursor-pointer ${
            currentTab === 'reservations'
              ? 'bg-apple-indigo text-white shadow-sm'
              : 'text-apple-label-sec hover:text-apple-label'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reservas</span>
        </button>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Waiter Calls Bell */}
        <button
          onClick={onOpenCallsQueue}
          className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all active:scale-[0.96] touch-manipulation cursor-pointer ${
            activeCallsCount > 0
              ? 'bg-apple-card border-apple-orange/50 shadow-sm shadow-apple-orange/20'
              : 'bg-apple-fill hover:bg-apple-fill/80 border-apple-border text-apple-label-sec hover:text-apple-label'
          }`}
          title="Cola de llamados"
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

        {/* Quick Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-apple-fill hover:bg-apple-fill/80 text-apple-label border border-apple-border transition-all active:scale-[0.96] touch-manipulation cursor-pointer hidden sm:flex items-center justify-center"
          title={resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-apple-yellow animate-in fade-in duration-150" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-apple-indigo animate-in fade-in duration-150" />
          )}
        </button>

        {/* User Mini Avatar on desktop */}
        {user && (
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-apple-border" title={user.email}>
            <div className="w-7 h-7 rounded-xl bg-apple-fill border border-apple-border flex items-center justify-center text-apple-label text-xs font-bold shrink-0">
              {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
            </div>
            <span className="text-xs font-semibold text-apple-label max-w-[100px] truncate leading-tight">
              {user.email}
            </span>
          </div>
        )}

        {/* Menu Slider Trigger Button (Centro de Control) */}
        <button
          onClick={onOpenMenu}
          className="p-2 rounded-xl bg-apple-fill hover:bg-apple-fill/80 text-apple-label border border-apple-border transition-all active:scale-[0.96] touch-manipulation cursor-pointer flex items-center justify-center"
          title="Menú y Centro de Control"
        >
          <Menu className="w-4 h-4 text-apple-label" />
        </button>
      </div>
    </header>
  );
};
