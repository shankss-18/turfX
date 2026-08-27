import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Format Date object to "DD-MM-YYYY"
function toDDMMYYYY(d) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Parse "DD-MM-YYYY" or "YYYY-MM-DD" or Date
function parseDate(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'string' && dateInput.includes('-')) {
    const parts = dateInput.split('-');
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return new Date(`${dateInput}T00:00:00`);
    } else if (parts[2]?.length === 4) {
      // DD-MM-YYYY
      const [dd, mm, yyyy] = parts;
      return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    }
  }
  return new Date(dateInput);
}

export default function DateStrip({
  selectedDate,
  onSelectDate,
  startDate,
  onPrevWeek,
  onNextWeek,
}) {
  const start = parseDate(startDate);

  // Generate 7 consecutive days starting from startDate
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateString = toDDMMYYYY(d); // "DD-MM-YYYY"
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayNumber = d.getDate();
    const isSelected = dateString === selectedDate;

    days.push({
      dateString,
      dayName,
      dayNumber,
      isSelected,
    });
  }

  // Format Month Year (e.g. "Aug 2026")
  const currentMonthYear = start.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-surface-1">
      {/* Header with Title and Month Navigator */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-headline font-semibold text-lg sm:text-xl text-on-surface">
          Select Date
        </h2>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevWeek}
            className="p-1.5 rounded-lg text-gray-500 hover:text-on-surface hover:bg-surface-low transition-colors cursor-pointer"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-headline font-semibold text-xs sm:text-sm text-on-surface min-w-[70px] text-center">
            {currentMonthYear}
          </span>
          <button
            type="button"
            onClick={onNextWeek}
            className="p-1.5 rounded-lg text-gray-500 hover:text-on-surface hover:bg-surface-low transition-colors cursor-pointer"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Date Tiles Carousel */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 sm:gap-3">
        {days.map((item) => (
          <button
            key={item.dateString}
            type="button"
            onClick={() => onSelectDate(item.dateString)}
            className={`flex flex-col items-center justify-center py-3.5 px-2 rounded-xl transition-all duration-200 select-none cursor-pointer ${
              item.isSelected
                ? 'bg-primary text-white shadow-md scale-[1.02]'
                : 'bg-white hover:bg-surface-low text-on-surface border border-gray-200/80 hover:border-gray-300'
            }`}
          >
            <span
              className={`text-[11px] font-sans font-semibold tracking-wider ${
                item.isSelected ? 'text-white/80' : 'text-gray-500'
              }`}
            >
              {item.dayName}
            </span>
            <span
              className={`font-headline font-bold text-xl sm:text-2xl mt-1 ${
                item.isSelected ? 'text-white' : 'text-on-surface'
              }`}
            >
              {item.dayNumber}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
