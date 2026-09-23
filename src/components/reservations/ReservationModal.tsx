import React, { useState, useEffect } from 'react';
import { Reservation, TableElement } from '../../types/database';
import { X, Users, Phone, Mail, Check } from 'lucide-react';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Reservation, 'id' | 'createdAt'> & { id?: string }) => void;
  tables: TableElement[];
  initialData?: Reservation | null;
  defaultDate?: string;
  defaultTableId?: string | null;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  tables,
  initialData,
  defaultDate,
  defaultTableId,
}) => {
  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];

  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || '');
  const [customerEmail, setCustomerEmail] = useState(initialData?.customerEmail || '');
  const [date, setDate] = useState(initialData?.date || defaultDate || today);
  const [time, setTime] = useState(initialData?.time || '20:00');
  const [pax, setPax] = useState(initialData?.pax || 2);
  const [tableId, setTableId] = useState<string | ''>(
    initialData?.tableId || defaultTableId || ''
  );
  const [notes, setNotes] = useState(initialData?.notes || '');

  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customerName);
      setCustomerPhone(initialData.customerPhone);
      setCustomerEmail(initialData.customerEmail || '');
      setDate(initialData.date);
      setTime(initialData.time);
      setPax(initialData.pax);
      setTableId(initialData.tableId || '');
      setNotes(initialData.notes || '');
    } else {
      if (defaultTableId) setTableId(defaultTableId);
      if (defaultDate) setDate(defaultDate);
    }
  }, [initialData, defaultDate, defaultTableId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id,
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      date,
      time,
      pax: Number(pax),
      tableId: tableId || null,
      notes: notes || undefined,
      status: initialData?.status || 'confirmed',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">
              {initialData ? 'Editar Reserva' : 'Nueva Reserva'}
            </h3>
            <p className="text-xs text-slate-400">
              Registra los datos del cliente y asigna mesa
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              placeholder="Ej. Juan Pérez"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Teléfono / WhatsApp *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  placeholder="+57 300 123 4567"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email (Opcional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Date, Time, Pax */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Hora
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Personas (Pax)
              </label>
              <div className="relative">
                <Users className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={pax}
                  onChange={(e) => setPax(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-7 pr-2 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Table Assignment */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Mesa Asignada
            </label>
            <select
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Sin mesa asignada (Pendiente) --</option>
              {tables.map((t) => {
                const isAdequate = t.seats >= pax;
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.seats} sillas) {isAdequate ? '✓' : '(Capacidad menor)'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Notas u Ocasión Especial
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ej. Cumpleaños, prefiere terraza, cliente celíaco..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl shadow-lg shadow-emerald-950 transition-all"
            >
              <Check className="w-4 h-4" />
              {initialData ? 'Guardar Cambios' : 'Confirmar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
