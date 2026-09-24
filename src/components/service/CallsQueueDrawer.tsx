import React, { useState, useEffect, useRef } from 'react';
import { WaiterCall } from '../../types/database';
import { calculateUrgency } from '../../utils/urgencyGradient';
import { playServiceChime } from '../../utils/soundAlert';
import {
  X,
  BellRing,
  Clock,
  CheckCircle2,
  Navigation,
  Receipt,
  HelpCircle,
  Volume2,
  VolumeX,
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
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousCallsCount = useRef(calls.length);

  // Live timer tick every second for continuous chromatic update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Play chime on new call arrival
  useEffect(() => {
    if (calls.length > previousCallsCount.current && soundEnabled) {
      playServiceChime();
    }
    previousCallsCount.current = calls.length;
  }, [calls.length, soundEnabled]);

  if (!isOpen) return null;

  // Strict FIFO sort: oldest call first
  const sortedCalls = [...calls].sort((a, b) => a.createdAt - b.createdAt);

  const getReasonIcon = (reason: WaiterCall['reason']) => {
    switch (reason) {
      case 'bill':
        return <Receipt className="w-4 h-4 text-amber-400" />;
      case 'help':
        return <HelpCircle className="w-4 h-4 text-sky-400" />;
      default:
        return <BellRing className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getReasonLabel = (reason: WaiterCall['reason']) => {
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl h-full flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Cola de Llamados
                {calls.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                    {calls.length}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">Orden de atención estricto (FIFO)</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-colors ${
                soundEnabled ? 'text-emerald-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
              }`}
              title={soundEnabled ? 'Sonido activado' : 'Sonido silenciado'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Call Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sortedCalls.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-sm">Sin llamados pendientes</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Todas las mesas están atendidas. Cuando un cliente pulse el llamado, sonará la campana y aparecerá aquí con su prioridad cromática.
              </p>
            </div>
          ) : (
            sortedCalls.map((call, index) => {
              const urgency = calculateUrgency(call.createdAt, currentTime);

              return (
                <div
                  key={call.id}
                  className={`rounded-2xl p-4 border transition-all duration-500 shadow-xl space-y-3 ${
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
                      <span className="w-5 h-5 rounded-full bg-slate-950 text-white font-mono text-[11px] font-bold flex items-center justify-center border border-slate-700">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        {getReasonIcon(call.reason)}
                        {getReasonLabel(call.reason)}
                      </span>
                    </div>

                    <div
                      className="px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1"
                      style={{
                        backgroundColor: urgency.hslColor,
                        color: '#020617',
                      }}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{urgency.formattedTime}</span>
                    </div>
                  </div>

                  {/* Table details and Session Word */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h4 className="text-base font-extrabold text-white">{call.tableName}</h4>
                      <p className="text-xs text-slate-400 font-mono font-medium">
                        Código: <span className="text-emerald-400 font-bold">{call.sessionWord}</span>
                      </p>
                    </div>

                    <span
                      className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md border"
                      style={{
                        borderColor: urgency.hslColor,
                        color: urgency.hslColor,
                      }}
                    >
                      {urgency.urgencyLabel}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    {call.status === 'pending' ? (
                      <button
                        onClick={() => onAttend(call.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-all"
                      >
                        <Navigation className="w-3.5 h-3.5 text-sky-400" />
                        <span>En camino</span>
                      </button>
                    ) : (
                      <span className="flex-1 text-center py-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/40 rounded-xl border border-emerald-800/40">
                        Atendiendo ahora
                      </span>
                    )}

                    <button
                      onClick={() => onResolve(call.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-950 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolver</span>
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
