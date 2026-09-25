import React from 'react';
import {
  X,
  User as UserIcon,
  LogOut,
  Sun,
  Moon,
  Laptop,
  Wifi,
  WifiOff,
  Database,
  BellRing,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme, ThemeMode } from '../../hooks/useTheme';

interface AppMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  pendingSyncCount: number;
  activeCallsCount?: number;
  onOpenBackup: () => void;
  onOpenCallsQueue?: () => void;
}

export const AppMenuDrawer: React.FC<AppMenuDrawerProps> = ({
  isOpen,
  onClose,
  isOnline,
  pendingSyncCount,
  activeCallsCount = 0,
  onOpenBackup,
  onOpenCallsQueue,
}) => {
  const { user, role, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const themeOptions: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Claro', icon: <Sun className="w-3.5 h-3.5 text-apple-yellow" /> },
    { mode: 'dark', label: 'Oscuro', icon: <Moon className="w-3.5 h-3.5 text-apple-indigo" /> },
    { mode: 'system', label: 'Auto', icon: <Laptop className="w-3.5 h-3.5 text-apple-label-sec" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Slide-over Drawer Panel */}
      <div className="w-full max-w-xs sm:max-w-sm bg-apple-card border-l border-apple-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250 transition-colors">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-apple-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-apple-fill flex items-center justify-center text-apple-label">
              <ShieldCheck className="w-4 h-4 text-apple-green" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-apple-label leading-tight">Centro de Control</h2>
              <p className="text-[10px] text-apple-label-sec">BarFlow MVP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-apple-label-sec hover:text-apple-label hover:bg-apple-fill active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* 1. User & Session Card */}
          {user && (
            <div className="bg-apple-secondary border border-apple-border p-3.5 rounded-2xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-apple-fill border border-apple-border flex items-center justify-center text-apple-label font-bold text-sm shrink-0">
                  {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-apple-label truncate">{user.email}</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 mt-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      role === 'manager'
                        ? 'bg-apple-purple/15 text-apple-purple border-apple-purple/30'
                        : 'bg-apple-blue/15 text-apple-blue border-apple-blue/30'
                    }`}
                  >
                    {role === 'manager' ? 'Gestor' : 'Colaborador'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-apple-fill hover:bg-apple-red/15 text-apple-label-sec hover:text-apple-red border border-apple-border hover:border-apple-red/30 rounded-xl font-semibold text-xs transition-all active:scale-[0.97] touch-manipulation cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}

          {/* 2. Theme Selector (Apple Segmented Control) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-apple-label-sec uppercase tracking-wider px-1">
              Aspecto Visual
            </label>
            <div className="grid grid-cols-3 gap-1 bg-apple-secondary border border-apple-border p-1 rounded-2xl">
              {themeOptions.map((opt) => (
                <button
                  key={opt.mode}
                  onClick={() => setTheme(opt.mode)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-[0.96] touch-manipulation cursor-pointer ${
                    theme === opt.mode
                      ? 'bg-apple-card text-apple-label shadow-sm border border-apple-border'
                      : 'text-apple-label-sec hover:text-apple-label'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Network & Sync Section */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-apple-label-sec uppercase tracking-wider px-1">
              Conexión & Datos
            </label>
            <div className="bg-apple-secondary border border-apple-border p-3.5 rounded-2xl space-y-3">
              {/* Online indicator */}
              <div className="flex items-center justify-between">
                <span className="text-apple-label-sec font-medium">Estado de Red:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    isOnline
                      ? 'bg-apple-green/15 text-apple-green border-apple-green/30'
                      : 'bg-apple-orange/15 text-apple-orange border-apple-orange/30'
                  }`}
                >
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </span>
              </div>

              {/* Pending events outbox */}
              <div className="flex items-center justify-between">
                <span className="text-apple-label-sec font-medium">Eventos en cola:</span>
                <span className="font-bold text-apple-label bg-apple-fill px-2 py-0.5 rounded-lg border border-apple-border">
                  {pendingSyncCount} pendientes
                </span>
              </div>

              {/* Backup modal trigger */}
              <button
                onClick={() => {
                  onClose();
                  onOpenBackup();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-apple-fill text-apple-label hover:bg-apple-fill/80 border border-apple-border rounded-xl font-semibold text-xs transition-all active:scale-[0.97] touch-manipulation cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-apple-green" />
                <span>Gestionar Copias de Seguridad</span>
              </button>
            </div>
          </div>

          {/* 4. Quick Actions */}
          {onOpenCallsQueue && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-apple-label-sec uppercase tracking-wider px-1">
                Llamados de Mesero
              </label>
              <button
                onClick={() => {
                  onClose();
                  onOpenCallsQueue();
                }}
                className="w-full flex items-center justify-between p-3 bg-apple-secondary border border-apple-border hover:bg-apple-fill/50 rounded-2xl transition-all active:scale-[0.97] touch-manipulation cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <BellRing className={`w-4 h-4 ${activeCallsCount > 0 ? 'text-apple-orange' : 'text-apple-label-sec'}`} />
                  <span className="font-semibold text-apple-label">Cola de Atención</span>
                </div>
                {activeCallsCount > 0 ? (
                  <span className="bg-apple-orange text-black font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                    {activeCallsCount}
                  </span>
                ) : (
                  <span className="text-apple-label-ter text-[11px]">Al día</span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-apple-border bg-apple-secondary/50 text-center text-[10px] text-apple-label-ter">
          BarFlow SaaS • Arquitectura Local-First
        </div>
      </div>
    </div>
  );
};
