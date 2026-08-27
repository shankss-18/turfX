import React from 'react';
import { Check, Clock } from 'lucide-react';

// Helper to format "06:00" to "06:00 AM"
function formatSlotTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 && hours < 24 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const padHours = String(displayHours).padStart(2, '0');
  const padMins = String(minutes).padStart(2, '0');
  return `${padHours}:${padMins} ${period}`;
}

export default function SlotCard({
  slot,
  isSelected,
  onSelect,
  onClick,
  isPeak = false,
  isPast = false,
}) {
  const isBooked = slot.status === 'booked' || slot.status === 'blocked';
  const formattedTime = formatSlotTime(slot.startTime);
  const priceDisplay = `₹${slot.price}`;

  const handleClick = () => {
    if (isPast) return;           // past slots are not clickable
    if (isBooked) return;
    if (onSelect) onSelect(slot);
    else if (onClick) onClick(slot);
  };

  // Past slot — greyed out with strikethrough time and "Expired" label
  if (isPast) {
    return (
      <div
        className="relative flex flex-col items-center justify-center py-4 px-3 rounded-xl bg-gray-100 border border-gray-200 cursor-not-allowed select-none opacity-50"
        title="This slot has already passed"
      >
        <Clock className="w-3 h-3 text-gray-400 mb-0.5" />
        <span className="font-headline font-semibold text-sm text-gray-400 line-through">
          {formattedTime}
        </span>
        <span className="text-[10px] text-gray-400 font-medium mt-0.5 uppercase tracking-wide">
          Expired
        </span>
      </div>
    );
  }

  if (isBooked) {
    return (
      <div
        className="relative flex flex-col items-center justify-center py-4 px-3 rounded-xl bg-[#edeeef] border border-gray-200 cursor-not-allowed select-none transition-all opacity-80"
        title="This slot is already booked"
      >
        <span className="font-headline font-semibold text-sm text-gray-400">
          {formattedTime}
        </span>
        <span className="text-xs text-gray-400 font-medium mt-0.5">
          Booked
        </span>
      </div>
    );
  }

  if (isSelected) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="relative flex flex-col items-center justify-center py-4 px-3 rounded-xl bg-primary text-white border-[1.5px] border-primary shadow-md cursor-pointer transition-all duration-150 transform scale-[1.02]"
      >
        {/* Floating top right checkmark */}
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-primary flex items-center justify-center shadow-sm border border-primary/20">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </span>
        
        <span className="font-headline font-bold text-sm text-white">
          {formattedTime}
        </span>
        <span className="text-xs font-semibold text-white/90 mt-0.5">
          {priceDisplay}
        </span>
      </button>
    );
  }

  // Available State
  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative flex flex-col items-center justify-center py-4 px-3 rounded-xl bg-white border-[1.5px] border-[#006c49] hover:bg-emerald-50/40 hover:shadow-sm cursor-pointer transition-all duration-150 group active:scale-[0.98]"
    >
      <span className="font-headline font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
        {formattedTime}
      </span>
      <span
        className={`text-xs font-bold mt-0.5 ${
          isPeak ? 'text-[#b45309]' : 'text-secondary'
        }`}
      >
        {priceDisplay}
      </span>
    </button>
  );
}
