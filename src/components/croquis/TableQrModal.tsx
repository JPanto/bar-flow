import React, { useState } from 'react';
import { TableElement, TableSession } from '../../types/database';
import { X, QrCode, ExternalLink, Copy, Check, Smartphone } from 'lucide-react';

interface TableQrModalProps {
  table: TableElement | null;
  session: TableSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSimulateInApp?: (tableId: string) => void;
}

export const TableQrModal: React.FC<TableQrModalProps> = ({
  table,
  session,
  isOpen,
  onClose,
  onSimulateInApp,
}) => {
  if (!isOpen || !table) return null;

  const [copied, setCopied] = useState(false);

  // Generate customer link with current origin and query param
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const customerUrl = `${baseUrl}?mesa=${table.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(customerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenTab = () => {
    window.open(customerUrl, '_blank');
  };

  // Standard lightweight SVG QR representation using Google Charts API or inline SVG fallback
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    customerUrl
  )}&bgcolor=0f172a&color=10b981&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col text-center">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-left">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{table.name}</h3>
              <p className="text-[11px] text-slate-400">Acceso Cliente por QR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex flex-col items-center">
          {session ? (
            <div className="bg-slate-950/60 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-400">
              Código Activo: <span className="font-mono font-bold text-white">{session.sessionWord}</span>
            </div>
          ) : (
            <div className="bg-slate-950/60 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs font-semibold text-amber-400">
              Mesa sin sesión activa
            </div>
          )}

          {/* QR Code Container */}
          <div className="w-56 h-56 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center p-3 shadow-inner overflow-hidden">
            <img
              src={qrApiUrl}
              alt={`QR para ${table.name}`}
              className="w-full h-full object-contain rounded-xl"
              onError={(e) => {
                // Fallback SVG placeholder if offline / network image unavailable
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <p className="text-xs text-slate-400 max-w-xs">
            Escanea este código con la cámara de un teléfono móvil para abrir la vista interactiva de esta mesa.
          </p>

          {/* Action buttons */}
          <div className="w-full space-y-2 pt-2">
            <button
              onClick={handleOpenTab}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Vista Cliente en Nueva Pestaña</span>
            </button>

            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Enlace Copiado!' : 'Copiar Enlace Directo'}</span>
            </button>

            {onSimulateInApp && (
              <button
                onClick={() => {
                  onSimulateInApp(table.id);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-white text-xs font-medium transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Simular vista de cliente en esta pantalla</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
