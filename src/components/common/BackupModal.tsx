import React, { useState } from 'react';
import { db } from '../../db';
import { downloadBackupFile, importDatabaseFromJson } from '../../utils/backup';
import { X, Download, Upload, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingSyncCount: number;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  pendingSyncCount,
}) => {
  if (!isOpen) return null;

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      await downloadBackupFile(db);
      setMessage({ type: 'success', text: 'Copia de seguridad descargada correctamente.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Error al descargar la copia.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('¿Restaurar esta copia? Los datos actuales serán reemplazados por el archivo.')) {
      return;
    }

    try {
      setIsProcessing(true);
      const content = await file.text();
      const result = await importDatabaseFromJson(db, content);

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Error leyendo archivo JSON.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-apple-card border border-apple-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-apple-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-apple-green/15 border border-apple-green/30 flex items-center justify-center text-apple-green">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-apple-label leading-tight">
                Copia de Seguridad y Sincronización
              </h3>
              <p className="text-[11px] text-apple-label-sec">Persistencia local sin conexión (IndexedDB)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-apple-label-sec hover:text-apple-label hover:bg-apple-fill active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Outbox Queue status in Apple grouped inset */}
          <div className="bg-apple-secondary border border-apple-border p-4 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-apple-label">Cola Outbox (Eventos Pendientes):</span>
              <span className="font-bold text-apple-green bg-apple-green/15 px-2.5 py-0.5 rounded-lg border border-apple-green/30">
                {pendingSyncCount} eventos
              </span>
            </div>
            <p className="text-apple-label-sec text-[11px] leading-relaxed">
              Tus cambios se guardan localmente y están listos para enviarse al backend o WebSockets en cuanto se conecte el servidor.
            </p>
          </div>

          {/* Feedback message */}
          {message && (
            <div
              className={`p-3.5 rounded-2xl border flex items-center gap-2.5 ${
                message.type === 'success'
                  ? 'bg-apple-green/15 border-apple-green/30 text-apple-green'
                  : 'bg-apple-red/15 border-apple-red/30 text-apple-red'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-apple-green" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-apple-red" />
              )}
              <span className="font-medium text-apple-label">{message.text}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleExport}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-apple-green text-white font-semibold rounded-2xl shadow-sm hover:opacity-95 active:scale-[0.98] transition-transform duration-100 touch-manipulation cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Respaldo JSON</span>
            </button>

            <label className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-apple-fill text-apple-label hover:bg-apple-fill/80 active:scale-[0.98] font-semibold rounded-2xl border border-dashed border-apple-border cursor-pointer transition-transform duration-100 touch-manipulation">
              <Upload className="w-4 h-4 text-apple-blue" />
              <span>Restaurar desde archivo JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-apple-secondary/60 border-t border-apple-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-apple-label-sec hover:text-apple-label hover:bg-apple-fill active:scale-[0.96] rounded-xl transition-all touch-manipulation cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
