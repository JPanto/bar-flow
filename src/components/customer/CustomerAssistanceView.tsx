import React from 'react';
import { TableSession, WaiterCall, CallReason } from '../../types/database';
import {
  BellRing,
  Receipt,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';

export interface CustomerAssistanceViewProps {
  activeSession?: TableSession | null;
  activeCall?: WaiterCall | null;
  urgency?: any;
  copied: boolean;
  isSubmitting: boolean;
  handleCopyWord: () => void;
  handleCall: (reason: CallReason) => void;
  handleCancelCall: () => void;
}

export const CustomerAssistanceView: React.FC<CustomerAssistanceViewProps> = ({
  activeSession,
  activeCall,
  urgency,
  copied,
  isSubmitting,
  handleCopyWord,
  handleCall,
  handleCancelCall,
}) => {
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
    <div className="w-full flex flex-col gap-4 sm:gap-6">
      {/* Dynamic Table Session Word Card */}
      <div className="bg-apple-card/85 backdrop-blur-xl border border-apple-border rounded-3xl p-5 sm:p-6 shadow-lg text-center space-y-3 relative overflow-hidden transition-all">
        <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-apple-green/10 rounded-full blur-2xl pointer-events-none" />

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-apple-green/10 text-apple-green text-xs font-semibold border border-apple-green/20">
          <ShieldCheck className="w-3.5 h-3.5" /> Tu Código de Mesa
        </span>

        <div className="py-0.5">
          <div className="text-3xl sm:text-4xl font-black tracking-wider font-mono text-apple-label">
            {activeSession ? activeSession.sessionWord : 'EN PREPARACIÓN'}
          </div>
        </div>

        <p className="text-xs text-apple-label-sec max-w-xs mx-auto leading-relaxed">
          Indica esta palabra en la caja para pagar directamente tu cuenta o solicitar consumos.
        </p>

        {activeSession && (
          <button
            onClick={handleCopyWord}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-apple-fill text-apple-label hover:bg-apple-fill/80 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] border border-apple-border touch-manipulation cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-apple-green" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
          </button>
        )}
      </div>

      {/* Live Call Status Card */}
      {activeCall && urgency ? (
        <div
          className={`border rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 transition-all duration-300 ${
            urgency.isCritical ? 'animate-pulse' : ''
          }`}
          style={{
            backgroundColor: urgency.hslBgColor,
            borderColor: urgency.hslColor,
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-black shadow-sm"
              style={{ backgroundColor: urgency.hslColor }}
            >
              {activeCall.status === 'attending' ? 'Mesero en camino' : 'Llamado Activo'}
            </span>

            <div className="flex items-center gap-1.5 text-xs font-bold text-apple-label">
              <Clock className="w-3.5 h-3.5" />
              <span>{urgency.formattedTime}</span>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-apple-label flex items-center gap-2">
              {activeCall.status === 'attending' ? (
                <CheckCircle2 className="w-5 h-5 text-apple-green shrink-0" />
              ) : (
                <BellRing className="w-5 h-5 animate-bounce shrink-0" style={{ color: urgency.hslColor }} />
              )}
              <span>
                {activeCall.status === 'attending'
                  ? '¡Tu mesero viene hacia la mesa!'
                  : `Solicitud: ${getReasonTitle(activeCall.reason)}`}
              </span>
            </h3>
            <p className="text-xs text-apple-label-sec mt-1">
              {activeCall.status === 'attending'
                ? 'El personal ha respondido a tu solicitud y se dirige a tu ubicación.'
                : 'Tu llamado encabeza la cola de atención por orden de llegada.'}
            </p>
          </div>

          {/* Dynamic Chromatic Progress Indicator */}
          <div className="w-full bg-apple-fill/50 rounded-full h-2 overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, Math.max(15, (urgency.secondsElapsed / 240) * 100))}%`,
                backgroundColor: urgency.hslColor,
              }}
            />
          </div>

          <button
            onClick={handleCancelCall}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-apple-card/90 text-apple-red hover:bg-apple-red/10 text-xs font-semibold rounded-2xl border border-apple-red/30 transition-all active:scale-[0.97] touch-manipulation cursor-pointer"
          >
            <XCircle className="w-4 h-4 text-apple-red" />
            Cancelar llamado
          </button>
        </div>
      ) : (
        /* Call Action Buttons Grid */
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-apple-label-sec text-center">
            ¿En qué podemos atenderte hoy?
          </h2>

          <div className="grid grid-cols-1 landscape:grid-cols-3 sm:grid-cols-3 gap-3">
            <button
              onClick={() => handleCall('waiter')}
              disabled={isSubmitting}
              className="w-full flex sm:flex-col landscape:flex-col items-center justify-between sm:justify-center landscape:justify-center p-4 bg-apple-card/80 hover:bg-apple-fill/50 active:scale-[0.97] border border-apple-border hover:border-apple-green/50 rounded-2xl shadow-sm transition-transform duration-100 ease-out text-left sm:text-center landscape:text-center group touch-manipulation cursor-pointer"
            >
              <div className="flex sm:flex-col landscape:flex-col items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-apple-green/15 text-apple-green flex items-center justify-center group-hover:scale-105 transition-transform duration-150">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-apple-label text-sm">Mesero</h3>
                  <p className="text-[11px] text-apple-label-sec sm:hidden landscape:hidden">Atención en mesa</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-apple-green bg-apple-green/10 px-2.5 py-1 rounded-xl sm:mt-2 landscape:mt-2">
                Llamar
              </span>
            </button>

            <button
              onClick={() => handleCall('bill')}
              disabled={isSubmitting}
              className="w-full flex sm:flex-col landscape:flex-col items-center justify-between sm:justify-center landscape:justify-center p-4 bg-apple-card/80 hover:bg-apple-fill/50 active:scale-[0.97] border border-apple-border hover:border-apple-orange/50 rounded-2xl shadow-sm transition-transform duration-100 ease-out text-left sm:text-center landscape:text-center group touch-manipulation cursor-pointer"
            >
              <div className="flex sm:flex-col landscape:flex-col items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-apple-orange/15 text-apple-orange flex items-center justify-center group-hover:scale-105 transition-transform duration-150">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-apple-label text-sm">La Cuenta</h3>
                  <p className="text-[11px] text-apple-label-sec sm:hidden landscape:hidden">Tarjeta o efectivo</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-apple-orange bg-apple-orange/10 px-2.5 py-1 rounded-xl sm:mt-2 landscape:mt-2">
                Pedir
              </span>
            </button>

            <button
              onClick={() => handleCall('help')}
              disabled={isSubmitting}
              className="w-full flex sm:flex-col landscape:flex-col items-center justify-between sm:justify-center landscape:justify-center p-4 bg-apple-card/80 hover:bg-apple-fill/50 active:scale-[0.97] border border-apple-border hover:border-apple-blue/50 rounded-2xl shadow-sm transition-transform duration-100 ease-out text-left sm:text-center landscape:text-center group touch-manipulation cursor-pointer"
            >
              <div className="flex sm:flex-col landscape:flex-col items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-apple-blue/15 text-apple-blue flex items-center justify-center group-hover:scale-105 transition-transform duration-150">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-apple-label text-sm">Asistencia</h3>
                  <p className="text-[11px] text-apple-label-sec sm:hidden landscape:hidden">Menú y cubiertos</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-apple-blue bg-apple-blue/10 px-2.5 py-1 rounded-xl sm:mt-2 landscape:mt-2">
                Ayuda
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
