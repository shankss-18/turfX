import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Sun,
  Moon,
  ArrowRight,
  TrendingUp,
  Layers,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Wrench,
  Check,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ─── helpers ─── */
function toDDMMYYYY(d = new Date()) {
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('-');
}

function parseDate(str) {
  if (!str) return new Date();
  const parts = str.split('-');
  if (parts[0].length === 4) return new Date(`${str}T00:00:00`);
  const [dd, mm, yyyy] = parts;
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
}

function fmt12(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const p = h >= 12 && h < 24 ? 'PM' : 'AM';
  const dh = h % 12 === 0 ? 12 : h % 12;
  return `${String(dh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
}

function timeToMins(t) {
  const [h, m] = (t || '0:0').split(':').map(Number);
  return h * 60 + m;
}

function isPastSlot(slot, dateStr) {
  try {
    const [dd, mm, yyyy] = dateStr.split('-');
    const [hh, min] = slot.endTime.split(':');
    const end = new Date(+yyyy, +mm - 1, +dd, +hh, +min, 0, 0);
    return end <= new Date();
  } catch {
    return false;
  }
}

function friendlyDate(dateStr) {
  if (!dateStr) return '';
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function rangeLabel(slots) {
  if (!slots.length) return '';
  const sorted = [...slots].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
  return `${fmt12(sorted[0].startTime)} – ${fmt12(sorted[slots.length - 1].endTime)}`;
}

/* ─── DateChip ─── */
function DateChip({ label, day, active, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center py-3 px-4 sm:px-5 rounded-2xl transition-all duration-200 flex-shrink-0 min-w-[4.25rem] sm:min-w-[5rem]
        ${
          active
            ? 'bg-primary text-white shadow-lg scale-105 ring-4 ring-primary/20'
            : 'bg-white border border-gray-200 text-on-surface hover:border-primary/40 hover:bg-primary/5 active:scale-95 shadow-sm'
        }
        ${disabled ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`text-[11px] font-bold uppercase tracking-wider ${
          active ? 'text-white/85' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
      <span
        className={`font-headline font-bold text-xl sm:text-2xl mt-1 leading-none ${
          active ? 'text-white' : 'text-on-surface'
        }`}
      >
        {day}
      </span>
    </button>
  );
}

/* ─── Spacious Slot Card ─── */
function SlotCard({ slot, isSelected, isPast, isBooked, isBlocked, onClick, animIdx = 0 }) {
  if (isPast) {
    return (
      <div
        className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-gray-50 border border-gray-200 cursor-not-allowed opacity-40 select-none space-y-1 animate-slot-pop"
        style={{ animationDelay: `${animIdx * 20}ms` }}
        title="This match slot has already passed"
      >
        <span className="font-headline font-semibold text-sm sm:text-base text-gray-400 line-through">
          {fmt12(slot.startTime)}
        </span>
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
          Expired
        </span>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div
        className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-amber-50/50 border border-amber-200 cursor-not-allowed select-none space-y-1 animate-slot-pop opacity-75"
        style={{ animationDelay: `${animIdx * 20}ms` }}
        title="Slot blocked by admin for maintenance"
      >
        <div className="flex items-center gap-1.5 text-amber-700">
          <Wrench className="w-3.5 h-3.5" />
          <span className="font-headline font-semibold text-sm sm:text-base">
            {fmt12(slot.startTime)}
          </span>
        </div>
        <span className="text-[10px] text-amber-700 font-semibold uppercase tracking-wide">
          Maintenance
        </span>
      </div>
    );
  }

  if (isBooked) {
    return (
      <div
        className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-gray-100/80 border border-gray-200 cursor-not-allowed opacity-70 select-none space-y-1 animate-slot-pop"
        style={{ animationDelay: `${animIdx * 20}ms` }}
        title="Already booked by another player"
      >
        <span className="font-headline font-semibold text-sm sm:text-base text-gray-400">
          {fmt12(slot.startTime)}
        </span>
        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">
          Booked
        </span>
      </div>
    );
  }

  if (isSelected) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="relative flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-primary text-white border-2 border-primary shadow-xl cursor-pointer transition-all duration-150 active:scale-95 space-y-1 animate-slot-pop animate-selected-pulse"
        style={{ animationDelay: `${animIdx * 20}ms` }}
      >
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-primary flex items-center justify-center shadow-md border-2 border-primary">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </span>
        <span className="font-headline font-bold text-sm sm:text-base text-white">
          {fmt12(slot.startTime)}
        </span>
        <span className="text-xs font-semibold text-white/90">
          ₹{slot.price}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center py-5 px-4 rounded-2xl bg-white border-[1.5px] border-emerald-600/90 hover:border-emerald-600 hover:bg-emerald-50/50 hover:shadow-md cursor-pointer transition-all duration-150 active:scale-95 group space-y-1 shadow-sm animate-slot-pop"
      style={{ animationDelay: `${animIdx * 20}ms` }}
    >
      <span className="font-headline font-bold text-sm sm:text-base text-on-surface group-hover:text-primary transition-colors">
        {fmt12(slot.startTime)}
      </span>
      <span className="text-xs font-bold text-secondary">
        ₹{slot.price}
      </span>
    </button>
  );
}

/* ─── Section ─── */
function SlotSection({ icon, label, slots, selectedSlots, selectedDate, onSlotClick, offset = 0, badge }) {
  return (
    <div className="space-y-4 animate-fade-up" style={{ animationDelay: `${offset}ms` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-headline font-bold text-base sm:text-lg text-on-surface">
            {label}
          </h2>
          <span className="text-xs font-semibold text-gray-400 ml-1">
            ({slots.length} {slots.length === 1 ? 'slot' : 'slots'})
          </span>
        </div>
        {badge}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {slots.map((slot, i) => (
          <SlotCard
            key={slot._id}
            slot={slot}
            isSelected={selectedSlots.some((s) => s._id === slot._id)}
            isPast={isPastSlot(slot, selectedDate)}
            isBlocked={slot.status === 'blocked'}
            isBooked={slot.status === 'booked'}
            onClick={() => onSlotClick(slot)}
            animIdx={offset / 20 + i}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Skeleton ─── */
function SlotSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in py-4">
      {[1, 2, 3].map((g) => (
        <div key={g} className="space-y-3">
          <div className="skeleton h-5 w-28 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ─── */
export default function BookSlot() {
  const navigate = useNavigate();
  const {
    selectedGround,
    setSelectedGround,
    selectedDate,
    setSelectedDate,
    selectedSlots,
    setSelectedSlots,
  } = useBooking();

  const today = toDDMMYYYY();
  const [stripStart, setStripStart] = useState(today);
  const [slots, setSlots] = useState([]);
  const [groundLoading, setGroundLoading] = useState(true);
  const [groundError, setGroundError] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const prevSlotKey = useRef('');

  // fetch ground
  useEffect(() => {
    (async () => {
      setGroundLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/grounds`);
        const data = await res.json();
        if (Array.isArray(data) && data.length) setSelectedGround(data[0]);
        else throw new Error('No ground found');
      } catch (e) {
        setGroundError(e.message);
      } finally {
        setGroundLoading(false);
      }
    })();
  }, [setSelectedGround]);

  // fetch slots
  useEffect(() => {
    if (!selectedGround?._id || !selectedDate) return;
    const key = `${selectedGround._id}:${selectedDate}`;
    if (key === prevSlotKey.current) return;
    prevSlotKey.current = key;

    (async () => {
      setSlotsLoading(true);
      setSlotsError(null);
      setSelectedSlots([]);
      try {
        let res = await fetch(
          `${API_URL}/api/slots?groundId=${selectedGround._id}&date=${selectedDate}`
        );
        let data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          await fetch(`${API_URL}/api/slots/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groundId: selectedGround._id, date: selectedDate }),
          });
          res = await fetch(
            `${API_URL}/api/slots?groundId=${selectedGround._id}&date=${selectedDate}`
          );
          data = await res.json();
        }
        setSlots(Array.isArray(data) ? data : []);
      } catch (e) {
        setSlotsError(e.message);
      } finally {
        setSlotsLoading(false);
      }
    })();
  }, [selectedGround?._id, selectedDate, setSelectedSlots]);

  // date strip — 7 days
  const stripDays = useMemo(() => {
    const start = parseDate(stripStart);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return {
        dateStr: toDDMMYYYY(d),
        label: d.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase().slice(0, 3),
        day: d.getDate(),
        isPast: d < new Date(new Date().setHours(0, 0, 0, 0)),
      };
    });
  }, [stripStart]);

  // slot click
  const handleSlotClick = (clicked) => {
    if (clicked.status !== 'available') return;
    if (isPastSlot(clicked, selectedDate)) return;

    const isAlready = selectedSlots.some((s) => s._id === clicked._id);
    if (isAlready) {
      if (selectedSlots.length <= 1) {
        setSelectedSlots([]);
        return;
      }
      const isFirst = selectedSlots[0]._id === clicked._id;
      const isLast = selectedSlots[selectedSlots.length - 1]._id === clicked._id;
      if (isFirst) setSelectedSlots(selectedSlots.slice(1));
      else if (isLast) setSelectedSlots(selectedSlots.slice(0, -1));
      else setSelectedSlots([clicked]);
      return;
    }
    if (!selectedSlots.length) {
      setSelectedSlots([clicked]);
      return;
    }

    const sorted = [...slots].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
    const fi = sorted.findIndex((s) => s._id === selectedSlots[0]._id);
    const li = sorted.findIndex((s) => s._id === selectedSlots[selectedSlots.length - 1]._id);
    const ci = sorted.findIndex((s) => s._id === clicked._id);
    if (ci === -1) return;

    if (ci === fi - 1) {
      setSelectedSlots([clicked, ...selectedSlots]);
      return;
    }
    if (ci === li + 1) {
      setSelectedSlots([...selectedSlots, clicked]);
      return;
    }

    const range = sorted.slice(Math.min(fi, ci), Math.max(li, ci) + 1);
    if (range.every((s) => s.status === 'available')) setSelectedSlots(range);
    else setSelectedSlots([clicked]);
  };

  // partition
  const { morning, afternoon, evening } = useMemo(() => {
    const m = [],
      af = [],
      e = [];
    slots.forEach((s) => {
      const mins = timeToMins(s.startTime);
      if (mins < 720) m.push(s);
      else if (mins < 1020) af.push(s);
      else e.push(s);
    });
    return { morning: m, afternoon: af, evening: e };
  }, [slots]);

  const totalPrice = useMemo(
    () => selectedSlots.reduce((s, sl) => s + (sl.price || 0), 0),
    [selectedSlots]
  );
  const sortedSelected = useMemo(
    () => [...selectedSlots].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime)),
    [selectedSlots]
  );

  const handleProceed = () => {
    if (!sortedSelected.length) return;
    navigate('/checkout', {
      state: {
        slotId: sortedSelected[0]._id,
        slotIds: sortedSelected.map((s) => s._id),
        slots: sortedSelected,
        groundId: selectedGround?._id,
        ground: selectedGround,
        date: selectedDate,
        totalAmount: totalPrice,
      },
    });
  };

  if (groundLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="skeleton w-64 h-7 rounded-xl" />
          <div className="skeleton w-40 h-5 rounded-xl" />
        </div>
      </div>
    );

  if (groundError)
    return (
      <div className="min-h-screen flex items-center justify-center text-error font-semibold animate-fade-in">
        {groundError}
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] pb-36">
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-10">
        {/* Header */}
        <div className="animate-fade-up space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>{selectedGround?.location || 'Gachibowli, Hyderabad'}</span>
          </div>

          <h1 className="font-headline font-bold text-3xl sm:text-4xl text-on-surface tracking-tight">
            Select Your <span className="text-primary">Match Slot</span>
          </h1>

          <p className="text-sm text-gray-500 font-sans">
            Pick single or continuous hours for your match. Floodlights included for evening games.
          </p>
        </div>

        {/* Date Strip with comfortable padding */}
        <div
          className="animate-fade-up bg-white rounded-3xl border border-gray-200/80 shadow-sm p-4 sm:p-6 space-y-3.5"
          style={{ animationDelay: '60ms' }}
        >
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {parseDate(stripStart).toLocaleDateString('en-IN', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const d = parseDate(stripStart);
                  d.setDate(d.getDate() - 7);
                  setStripStart(toDDMMYYYY(d));
                }}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                title="Previous Week"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = parseDate(stripStart);
                  d.setDate(d.getDate() + 7);
                  setStripStart(toDDMMYYYY(d));
                }}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                title="Next Week"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-1.5 scrollbar-hide">
            {stripDays.map(({ dateStr, label, day, isPast }) => (
              <DateChip
                key={dateStr}
                label={label}
                day={day}
                active={selectedDate === dateStr}
                disabled={isPast}
                onClick={() => setSelectedDate(dateStr)}
              />
            ))}
          </div>
        </div>

        {/* Slots Content */}
        {slotsLoading && <SlotSkeleton />}

        {slotsError && (
          <div className="flex flex-col items-center gap-3 py-16 animate-fade-in bg-white rounded-3xl border border-red-100 p-8">
            <p className="text-error text-sm font-semibold">{slotsError}</p>
            <button
              onClick={() => {
                prevSlotKey.current = '';
                setSelectedDate(selectedDate);
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
          </div>
        )}

        {!slotsLoading && !slotsError && slots.length === 0 && (
          <div className="text-center py-20 animate-fade-in bg-white rounded-3xl border border-gray-200 p-8 space-y-2">
            <p className="font-headline font-bold text-lg text-on-surface">No slots available</p>
            <p className="text-gray-500 text-xs">Please select another date from the strip above.</p>
          </div>
        )}

        {!slotsLoading && !slotsError && slots.length > 0 && (
          <div className="space-y-8 sm:space-y-10">
            {morning.length > 0 && (
              <SlotSection
                icon={<Sun className="w-5 h-5 text-amber-500" />}
                label="Morning"
                slots={morning}
                selectedSlots={selectedSlots}
                selectedDate={selectedDate}
                onSlotClick={handleSlotClick}
                offset={0}
              />
            )}

            {afternoon.length > 0 && (
              <SlotSection
                icon={<Sun className="w-5 h-5 text-orange-400" />}
                label="Afternoon"
                slots={afternoon}
                selectedSlots={selectedSlots}
                selectedDate={selectedDate}
                onSlotClick={handleSlotClick}
                offset={60}
              />
            )}

            {evening.length > 0 && (
              <SlotSection
                icon={<Moon className="w-5 h-5 text-primary" />}
                label="Evening"
                slots={evening}
                selectedSlots={selectedSlots}
                selectedDate={selectedDate}
                onSlotClick={handleSlotClick}
                offset={120}
                badge={
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    <span>Peak Hours</span>
                  </span>
                }
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Action Bar with clear spacing */}
      {selectedSlots.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 animate-slide-up">
          <div className="max-w-6xl mx-auto px-4 pb-5">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/90 shadow-2xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {selectedSlots.length} {selectedSlots.length > 1 ? 'Slots' : 'Slot'} Selected · {friendlyDate(selectedDate)}
                  </p>
                  <p className="font-headline font-bold text-base sm:text-lg text-on-surface truncate">
                    {rangeLabel(sortedSelected)}
                    <span className="text-primary font-bold ml-2.5">₹{totalPrice}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceed}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#2d1eb3] text-white font-headline font-semibold text-sm sm:text-base px-7 py-3 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <span>Proceed to Book</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}