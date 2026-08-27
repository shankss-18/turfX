import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Check, Calendar, Clock, MapPin, Compass, ArrowRight,
  Download,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';

/* ─── helpers ─── */
function formatConfirmedDate(dateStr) {
  if (!dateStr) return 'Today';
  const parts = dateStr.split('-');
  let d;
  if (parts[2]?.length === 4) {
    const [dd, mm, yyyy] = parts;
    d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  } else {
    d = new Date(`${dateStr}T00:00:00`);
  }
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const p = h >= 12 && h < 24 ? 'PM' : 'AM';
  const dh = h % 12 === 0 ? 12 : h % 12;
  return `${String(dh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
}

function formatTimeRange(startTime, endTime) {
  if (!startTime) return '06:00 PM – 07:00 PM';
  return `${fmt12(startTime)} – ${fmt12(endTime || '19:00')}`;
}

export default function Confirmation() {
  const location = useLocation();
  const { lastBooking, selectedGround, selectedDate, selectedSlots } = useBooking();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const booking = location.state?.booking || lastBooking;
  const ground = location.state?.ground || selectedGround;

  const allSlots = location.state?.slots || (selectedSlots?.length > 0 ? selectedSlots : null);
  const slot = location.state?.slot || allSlots?.[0];
  const lastSlot = allSlots?.[allSlots.length - 1];

  const totalAmount = location.state?.totalAmount || booking?.amount || 0;
  const dateStr = location.state?.date || booking?.date || selectedDate;

  const bookingId = booking?._id
    ? `#TX${booking._id.slice(-6).toUpperCase()}`
    : `#TX${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const groundName = ground?.name || booking?.ground?.name || 'Green Box Cricket';
  const groundLocation = ground?.location || booking?.ground?.location || 'Gachibowli, Hyderabad';
  const timeDisplay = slot ? formatTimeRange(slot.startTime, lastSlot?.endTime || slot.endTime) : '06:00 PM – 07:00 PM';
  const slotsCount = allSlots?.length || 1;

  const handleCalendar = () => {
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:TurfX Match @ ${groundName}\nDESCRIPTION:Booking ${bookingId}\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = `TurfX_${bookingId}.ics`;
    a.click();
  };

  const handleDirections = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(groundName + ' ' + groundLocation)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-between">
      
      {/* Main Container with generous spacing */}
      <main className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 space-y-8">
        
        {/* Success Header */}
        <div className={`text-center space-y-3 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100/80 text-emerald-600 shadow-sm ring-8 ring-emerald-50 mb-2">
            <Check className="w-8 h-8 stroke-[2.5]" />
          </div>

          <h1 className="font-headline font-bold text-3xl sm:text-4xl text-on-surface tracking-tight">
            Booking Confirmed!
          </h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Your match slot has been reserved. A confirmation has been sent to your contact details.
          </p>
        </div>

        {/* Confirmation Card with spacious layout */}
        <div
          className={`bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 sm:p-8 space-y-6 transition-all duration-500 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          {/* Card Header: Ground & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-gray-100">
            <div>
              <h2 className="font-headline font-bold text-xl sm:text-2xl text-on-surface">
                {groundName}
              </h2>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span>{groundLocation}</span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Confirmed
            </span>
          </div>

          {/* 2x2 Details Grid with breathing room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-2">
            {/* Date */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Date
              </span>
              <div className="flex items-center gap-2 text-base font-semibold text-on-surface">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{formatConfirmedDate(dateStr)}</span>
              </div>
            </div>

            {/* Time */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Time Slot {slotsCount > 1 && `(${slotsCount} hrs)`}
              </span>
              <div className="flex items-center gap-2 text-base font-semibold text-on-surface">
                <Clock className="w-4 h-4 text-primary" />
                <span>{timeDisplay}</span>
              </div>
            </div>

            {/* Booking ID */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Booking ID
              </span>
              <p className="font-headline font-bold text-base text-on-surface">
                {bookingId}
              </p>
            </div>

            {/* Amount Paid */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Amount Paid
              </span>
              <p className="font-headline font-bold text-2xl text-primary">
                ₹{totalAmount}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons with clear hierarchy */}
        <div className={`space-y-3 pt-2 transition-all duration-500 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Secondary Quick Action Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCalendar}
              className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-on-surface font-semibold text-sm transition-all active:scale-98 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>Add to Calendar</span>
            </button>

            <button
              type="button"
              onClick={handleDirections}
              className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-on-surface font-semibold text-sm transition-all active:scale-98 shadow-sm cursor-pointer"
            >
              <Compass className="w-4 h-4 text-primary" />
              <span>Get Directions</span>
            </button>
          </div>

          {/* Primary CTA */}
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-primary hover:bg-[#2d1eb3] text-white font-headline font-semibold text-base shadow-sm active:scale-98 transition-all"
          >
            <span>Back to Home</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </main>

      {/* Clean Subtle Footer */}
      <footer className="text-center py-6 text-xs text-gray-400 border-t border-gray-200/50">
        © {new Date().getFullYear()} TurfX Box Cricket. All rights reserved.
      </footer>

    </div>
  );
}
