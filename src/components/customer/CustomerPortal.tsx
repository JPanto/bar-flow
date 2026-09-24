import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, createWaiterCall, cancelWaiterCall } from '../../db';
import { calculateUrgency } from '../../utils/urgencyGradient';
import { realtimeService } from '../../services/realtime';
import { CallReason, WaiterCall } from '../../types/database';
import {
  BellRing,
  Receipt,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  UtensilsCrossed,
  ShieldCheck,
} from 'lucide-react';

interface CustomerPortalProps {
  tableId: string;
  onExitToStaff?: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ tableId, onExitToStaff }) => {
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live timer tick every 1 second for smooth chromatic gradient transition
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch table and active session
  const table = useLiveQuery(() => db.restaurantTables.get(tableId), [tableId]);
  const activeSession = useLiveQuery(
    () => db.table_sessions.where({ tableId, status: 'active' }).first(),
    [tableId]
  );

  // Fetch active call for this table
  const activeCall = useLiveQuery(
    () =>
      db.waiter_calls
        .where('tableId')
        .equals(tableId)
        .filter((c) => c.status === 'pending' || c.status === 'attending')
        .first(),
    [tableId]
  );

  const urgency = activeCall
    ? calculateUrgency(activeCall.createdAt, currentTime)
    : null;

  const handleCopyWord = () => {
    if (activeSession?.sessionWord) {
      navigator.clipboard.writeText(activeSession.sessionWord);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCall = async (reason: CallReason) => {
    if (!table || !activeSession || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const call = await createWaiterCall(db, {
        tableId: table.id,
        sessionId: activeSession.id,
        tableName: table.name,
        sessionWord: activeSession.sessionWord,
        reason,
      });

      // Broadcast in real-time
      realtimeService.publish({
        type: 'CALL_CREATED',
        payload: { call },
        timestamp: Date.now(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelCall = async () => {
    if (!activeCall) return;
    await cancelWaiterCall(db, activeCall.id);
    realtimeService.publish({
      type: 'CALL_CANCELLED',
      payload: { callId: activeCall.id },
      timestamp: Date.now(),
    });
  };

  if (!table) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <UtensilsCrossed className="w-12 h-12 text-slate-600 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-white mb-2">Mesa no encontrada</h2>
        <p className="text-slate-400 text-sm max-w-sm mb-6">
          El identificador de mesa no es válido o la mesa fue removida del plano.
        </p>
        {onExitToStaff && (
          <button
            onClick={onExitToStaff}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl"
          >
            Ir al Panel Principal
          </button>
        )}
      </div>
    );
  }

  const getReasonTitle = (reason: CallReason) => {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto relative shadow-2xl overflow-x-hidden selection:bg-emerald-500 selection:text-black">
      {/* Top Header */}
      <header className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-950">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-wider">{table.name}</h1>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Mesa Conectada
            </p>
          </div>
        </div>

        {onExitToStaff && (
          <button
            onClick={onExitToStaff}
            className="text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800/80 border border-slate-800 transition-colors"
          >
            Volver a Staff
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="p-5 flex-1 flex flex-col justify-center space-y-6">
        {/* Dynamic Table Session Code Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/90 rounded-3xl p-5 shadow-2xl text-center space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Tu Código de Mesa
          </span>

          <div className="py-1">
            <div className="text-3xl sm:text-4xl font-black text-white tracking-wider font-mono">
              {activeSession ? activeSession.sessionWord : 'EN PREPARACIÓN'}
            </div>
          </div>

          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Indica esta palabra en la caja para pagar directamente tu cuenta o solicitar consumos.
          </p>

          {activeSession && (
            <button
              onClick={handleCopyWord}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all active:scale-95 border border-slate-700/60"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
            </button>
          )}
        </div>

        {/* Live Call Status Card (If Customer has active call) */}
        {activeCall && urgency ? (
          <div
            className={`border rounded-3xl p-5 shadow-2xl space-y-4 transition-all duration-500 ${
              urgency.isCritical ? 'animate-pulse' : ''
            }`}
            style={{
              backgroundColor: urgency.hslBgColor,
              borderColor: urgency.hslColor,
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-slate-950"
                style={{ backgroundColor: urgency.hslColor }}
              >
                {activeCall.status === 'attending' ? 'Mesero en camino' : 'Llamado Activo'}
              </span>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Clock className="w-3.5 h-3.5" />
                <span>{urgency.formattedTime}</span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {activeCall.status === 'attending' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <BellRing className="w-5 h-5 animate-bounce shrink-0" style={{ color: urgency.hslColor }} />
                )}
                <span>
                  {activeCall.status === 'attending'
                    ? '¡Tu mesero viene hacia la mesa!'
                    : `Solicitud: ${getReasonTitle(activeCall.reason)}`}
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {activeCall.status === 'attending'
                  ? 'El personal ha respondido a tu solicitud y se dirige a tu ubicación.'
                  : 'Tu llamado encabeza la cola de atención por orden de llegada.'}
              </p>
            </div>

            {/* Dynamic Chromatic Progress Indicator */}
            <div className="w-full bg-slate-950/60 rounded-full h-2 overflow-hidden">
              <div
                className="h-full transition-all duration-1000 rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(15, (urgency.secondsElapsed / 240) * 100))}%`,
                  backgroundColor: urgency.hslColor,
                }}
              />
            </div>

            <button
              onClick={handleCancelCall}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-2xl border border-slate-700/80 transition-colors"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              Cancelar llamado
            </button>
          </div>
        ) : (
          /* Call Action Buttons Grid */
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
              ¿En qué podemos atenderte hoy?
            </h2>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleCall('waiter')}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between p-4 bg-slate-900 hover:bg-emerald-950/40 active:scale-[0.98] border border-slate-800 hover:border-emerald-500/50 rounded-2xl shadow-xl transition-all text-left group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <BellRing className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Llamar al Mesero</h3>
                    <p className="text-xs text-slate-400">Solicitar atención en la mesa</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-xl">
                  Llamar
                </span>
              </button>

              <button
                onClick={() => handleCall('bill')}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between p-4 bg-slate-900 hover:bg-amber-950/40 active:scale-[0.98] border border-slate-800 hover:border-amber-500/50 rounded-2xl shadow-xl transition-all text-left group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Pedir la Cuenta</h3>
                    <p className="text-xs text-slate-400">Preparar pago con tarjeta o efectivo</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-xl">
                  Cuenta
                </span>
              </button>

              <button
                onClick={() => handleCall('help')}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between p-4 bg-slate-900 hover:bg-sky-950/40 active:scale-[0.98] border border-slate-800 hover:border-sky-500/50 rounded-2xl shadow-xl transition-all text-left group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Asistencia General</h3>
                    <p className="text-xs text-slate-400">Dudas del menú, cubiertos o limpieza</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-sky-400 bg-sky-950/60 px-2.5 py-1 rounded-xl">
                  Ayuda
                </span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center border-t border-slate-900 text-[11px] text-slate-600">
        Bar & Resto Flow • Experiencia en Mesa
      </footer>
    </div>
  );
};
