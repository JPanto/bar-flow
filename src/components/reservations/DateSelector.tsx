import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onSelectDate }) => {
  const today = new Date().toISOString().split('T')[0];

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  // Format date nicely in Spanish
  const [year, month, day] = selectedDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const formattedDate = dateObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
      <div className="flex items-center gap-1.5">
        <button
          onClick={handlePrevDay}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
          title="Día anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSelectDate(today)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedDate === today
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Hoy
        </button>

        <button
          onClick={() => onSelectDate(tomorrow)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedDate === tomorrow
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Mañana
        </button>

        <button
          onClick={handleNextDay}
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
          title="Día siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Date display & picker input */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-300 capitalize hidden sm:inline">
          {formattedDate}
        </span>
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onSelectDate(e.target.value)}
            className="bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
