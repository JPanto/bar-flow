import React, { useState, useEffect } from 'react';
import { WaiterCall, CallReason } from '../../types/database';
import { calculateUrgency } from '../../utils/urgencyGradient';
import { playServiceChime } from '../../utils/soundAlert';
import {
  BellRing,
  CheckCircle2,
  Clock,
  Navigation,
  X,
  Volume2,
  VolumeX,
  Receipt,
  HelpCircle,
  UtensilsCrossed,
} from 'lucide-react';

interface CallsQueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  calls: WaiterCall[];
  onAttend: (callId: string) => void;
  onResolve: (callId: string) => void;
}

export const CallsQueueDrawer: React.FC<CallsQueueDrawerProps> = ({
  isOpen,
  onClose,
  calls,
  onAttend,
  onResolve,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Urgent calls timer tick
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Audio alert on new incoming call
  useEffect(() => {
    if (calls.some((c) => c.status === 'pending') && soundEnabled && isOpen) {
      playServiceChime();
    }
  }, [calls.length, soundEnabled, isOpen]);

  if (!isOpen) return null;

  // Strict FIFO: Oldest pending calls first
  const sortedCalls = [...calls].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const getReasonIcon = (reason: CallReason) => {
    switch (reason) {
      case 'bill':
        return <Receipt className="w-4 h-4 text-apple-orange" />;
      case 'help':
        return <HelpCircle className="w-4 h-4 text-apple-blue" />;
      default:
        return <UtensilsCrossed className="w-4 h-4 text-apple-green" />;
    }
  };

  const getReasonLabel = (reason: CallReason) => {
    switch (reason) {
      case 'bill':
        return 'Pedir la Cuenta';
      case 'help':
        return 'Asistencia';
      default:
        return 'Llamar al Mesero';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-apple-card border-l border-apple-border shadow-2xl h-full flex flex-col transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-apple-border flex items-center justify-between bg-apple-card/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-apple-orange/15 border border-apple-orange/30 flex items-center justify-center text-apple-orange">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-apple-label flex items-center gap-2">
                Cola de Llamados
                {calls.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-apple-orange text-black">
                    {calls.length}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-apple-label-sec">Orden de atención estricto (FIFO)</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-all active:scale-[0.96] touch-manipulation cursor-pointer ${
                soundEnabled ? 'text-apple-green bg-apple-green/10' : 'text-apple-label-sec hover:bg-apple-fill'
              }`}
              title={soundEnabled ? 'Sonido activado' : 'Sonido silenciado'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-apple-label-sec hover:text-apple-label hover:bg-apple-fill active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Call Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sortedCalls.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-apple-green/15 border border-apple-green/30 text-apple-green flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-apple-label text-sm">Sin llamados pendientes</h3>
              <p className="text-xs text-apple-label-sec max-w-xs mx-auto">
                Todas las mesas están atendidas. Cuando un cliente pulse el llamado, sonará la campana y aparecerá aquí con su prioridad cromática.
              </p>
            </div>
          ) : (
            sortedCalls.map((call, index) => {
              const urgency = calculateUrgency(call.createdAt, currentTime);

              return (
                <div
                  key={call.id}
                  className={`rounded-2xl p-4 border transition-all duration-300 shadow-md space-y-3 ${
                    urgency.isCritical ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: urgency.hslBgColor,
                    borderColor: urgency.hslColor,
                  }}
                >
                  {/* Top Bar: Queue Position & Elapsed Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-apple-fill text-apple-label font-mono text-[11px] font-bold flex items-center justify-center border border-apple-border">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-bold text-apple-label flex items-center gap-1.5">
                        {getReasonIcon(call.reason)}
                        {getReasonLabel(call.reason)}
                      </span>
                    </div>

                    <div
                      className="px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 text-black shadow-sm"
                      style={{ backgroundColor: urgency.hslColor }}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{urgency.formattedTime}</span>
                    </div>
                  </div>

                  {/* Table details and Session Word */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h4 className="text-base font-extrabold text-apple-label">{call.tableName}</h4>
                      <p className="text-xs text-apple-label-sec font-mono font-medium">
                        Código: <span className="text-apple-green font-bold">{call.sessionWord}</span>
                      </p>
                    </div>

                    <span
                      className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border"
                      style={{
                        borderColor: urgency.hslColor,
                        color: urgency.hslColor,
                        backgroundColor: 'rgba(0,0,0,0.2)',
                      }}
                    >
                      {call.status === 'attending' ? 'En camino' : 'Pendiente'}
                    </span>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-apple-border/40">
                    {call.status === 'pending' ? (
                      <button
                        onClick={() => onAttend(call.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-apple-fill hover:bg-apple-fill/80 text-apple-label font-semibold text-xs rounded-xl border border-apple-border transition-all active:scale-[0.97] touch-manipulation cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5 text-apple-blue" />
                        <span>Voy en camino</span>
                      </button>
                    ) : (
                      <div className="flex-1 text-center py-2 text-xs font-semibold text-apple-green bg-apple-green/15 rounded-xl">
                        Atendiendo ahora
                      </div>
                    )}

                    <button
                      onClick={() => onResolve(call.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-apple-green text-white font-semibold text-xs rounded-xl shadow-sm hover:opacity-95 transition-all active:scale-[0.97] touch-manipulation cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resuelto</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
