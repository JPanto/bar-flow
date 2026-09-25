import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const today = new Date().toISOString().split('T')[0];

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

  // Human friendly formatting in Spanish
  const [year, month, day] = selectedDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const formattedDate = dateObj.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-apple-card/85 backdrop-blur-xl border border-apple-border p-3 rounded-2xl select-none transition-colors">
      <div className="flex items-center gap-1.5">
        <button
          onClick={handlePrevDay}
          className="p-1.5 hover:bg-apple-fill text-apple-label-sec hover:text-apple-label rounded-xl transition-all active:scale-[0.96] touch-manipulation cursor-pointer"
          title="Día anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSelectDate(today)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.96] touch-manipulation cursor-pointer ${
            selectedDate === today
              ? 'bg-apple-green text-white shadow-sm'
              : 'text-apple-label-sec hover:text-apple-label hover:bg-apple-fill'
          }`}
        >
          Hoy
        </button>

        <button
          onClick={handleNextDay}
          className="p-1.5 hover:bg-apple-fill text-apple-label-sec hover:text-apple-label rounded-xl transition-all active:scale-[0.96] touch-manipulation cursor-pointer"
          title="Día siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-apple-green shrink-0" />
        <span className="text-xs font-semibold text-apple-label capitalize">
          {formattedDate}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onSelectDate(e.target.value)}
          className="bg-apple-fill border border-apple-border hover:border-apple-green/50 rounded-xl px-3 py-1.5 text-xs text-apple-label focus:outline-none focus:border-apple-green cursor-pointer transition-colors"
        />
      </div>
    </div>
  );
};
