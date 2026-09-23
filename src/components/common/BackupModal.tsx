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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Copia de Seguridad y Sincronización</h3>
              <p className="text-[11px] text-slate-400">Persistencia local sin conexión (IndexedDB)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Outbox Queue status */}
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Cola Outbox (Eventos Pendientes):</span>
              <span className="font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-800/40">
                {pendingSyncCount} eventos
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Tus cambios se guardan localmente y están listos para enviarse al backend o WebSockets en cuanto se conecte el servidor.
            </p>
          </div>

          {/* Feedback message */}
          {message && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleExport}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-semibold rounded-xl border border-slate-700 transition-all shadow-md"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Descargar Respaldo JSON</span>
            </button>

            <label className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-950 hover:bg-slate-900 active:scale-95 text-slate-300 hover:text-white font-semibold rounded-xl border border-dashed border-slate-700 cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-sky-400" />
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
        <div className="px-6 py-3 bg-slate-950/40 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
