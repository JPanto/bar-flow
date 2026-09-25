import React from 'react';
import { TableElement, TableSession } from '../../types/database';
import { X, QrCode, ExternalLink, Smartphone } from 'lucide-react';

interface TableQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: TableElement | null;
  session: TableSession | null;
  onSimulateInApp?: (tableId: string) => void;
}

export const TableQrModal: React.FC<TableQrModalProps> = ({
  isOpen,
  onClose,
  table,
  session,
  onSimulateInApp,
}) => {
  if (!isOpen || !table) return null;

  const currentOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'https://barflow.app';
  const customerUrl = `${currentOrigin}/?mesa=${table.id}`;

  const handleOpenTab = () => {
    window.open(customerUrl, '_blank');
  };

  const handleSimulate = () => {
    if (onSimulateInApp) {
      onSimulateInApp(table.id);
      onClose();
    }
  };

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    customerUrl
  )}&bgcolor=ffffff&color=000000&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-apple-card border border-apple-border rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col text-center transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-apple-border">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-xl bg-apple-green/15 border border-apple-green/30 flex items-center justify-center text-apple-green">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-apple-label">{table.name}</h3>
              <p className="text-[11px] text-apple-label-sec">Acceso Cliente por QR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-apple-label-sec hover:text-apple-label hover:bg-apple-fill active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex flex-col items-center">
          {session ? (
            <div className="bg-apple-green/10 border border-apple-green/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-apple-green">
              Código Activo: <span className="font-mono font-bold text-apple-label">{session.sessionWord}</span>
            </div>
          ) : (
            <div className="bg-apple-orange/10 border border-apple-orange/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-apple-orange">
              Mesa sin sesión activa
            </div>
          )}

          {/* QR Code Container (Always crisp white background for high scan contrast) */}
          <div className="w-52 h-52 bg-white border border-apple-border rounded-2xl flex items-center justify-center p-3 shadow-sm overflow-hidden">
            <img
              src={qrApiUrl}
              alt={`QR para ${table.name}`}
              className="w-full h-full object-contain rounded-xl"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <p className="text-xs text-apple-label-sec max-w-xs">
            Escanea este código con la cámara de un teléfono móvil para abrir la vista interactiva de esta mesa.
          </p>

          {/* Action buttons */}
          <div className="w-full space-y-2 pt-2">
            <button
              onClick={handleOpenTab}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-apple-green text-white font-semibold text-xs rounded-xl shadow-sm hover:opacity-95 active:scale-[0.97] transition-all touch-manipulation cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Portal de Cliente</span>
            </button>

            {onSimulateInApp && (
              <button
                onClick={handleSimulate}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-apple-fill text-apple-label hover:bg-apple-fill/80 border border-apple-border font-semibold text-xs rounded-xl active:scale-[0.97] transition-all touch-manipulation cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-apple-blue" />
                <span>Simular en esta Pantalla</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
