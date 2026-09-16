import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  Compass,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  CalendarDays,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Receipt,
  Info,
} from 'lucide-react';
import Button from '../components/common/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
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

function formatSlotRange(startTime, endTime) {
  if (!startTime) return '06:00 PM – 07:00 PM';
  return `${fmt12(startTime)} – ${fmt12(endTime || '19:00')}`;
}

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

// Calculate refund based on graduated policy:
// 80% refund if cancelled before 20 hours
// 60% refund if cancelled before 12 hours (12–20h)
// 40% refund if cancelled before 6 hours (6–12h)
// 0% refund if cancelled before 2 hours (2–6h, Non-refundable)
// < 2 hours: Cancellation closed
function getRefundTier(slotDateStr, slotStartTimeStr, totalAmount = 600) {
  try {
    if (!slotDateStr || !slotStartTimeStr) {
      return { allowed: true, percentage: 80, amount: Math.round(totalAmount * 0.8), tier: '80% (> 20 hrs)', diffHours: 24 };
    }
    let yyyy, mm, dd;
    if (slotDateStr.includes('-') && slotDateStr.split('-')[0].length === 4) {
      [yyyy, mm, dd] = slotDateStr.split('-');
    } else {
      [dd, mm, yyyy] = slotDateStr.split('-');
    }
    const [hh, min] = slotStartTimeStr.split(':');
    const slotDate = new Date(+yyyy, +mm - 1, +dd, +hh, +min, 0, 0);
    const now = new Date();
    const diffHours = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 2) {
      return {
        allowed: false,
        percentage: 0,
        amount: 0,
        diffHours: Math.max(0, diffHours),
        reason: 'Cancellation closed (< 2 hours remaining before match time)',
        tier: 'Closed (< 2 hrs)',
      };
    }
    if (diffHours >= 20) {
      return {
        allowed: true,
        percentage: 80,
        amount: Math.round((totalAmount * 80) / 100),
        diffHours,
        tier: '80% Refund (> 20 hrs before match)',
      };
    }
    if (diffHours >= 12) {
      return {
        allowed: true,
        percentage: 60,
        amount: Math.round((totalAmount * 60) / 100),
        diffHours,
        tier: '60% Refund (12–20 hrs before match)',
      };
    }
    if (diffHours >= 6) {
      return {
        allowed: true,
        percentage: 40,
        amount: Math.round((totalAmount * 40) / 100),
        diffHours,
        tier: '40% Refund (6–12 hrs before match)',
      };
    }
    // 2 to 6 hours
    return {
      allowed: true,
      percentage: 0,
      amount: 0,
      diffHours,
      tier: '0% Refund (2–6 hrs before match — Non-refundable)',
    };
  } catch (e) {
    return { allowed: true, percentage: 80, amount: Math.round(totalAmount * 0.8), tier: '80% Refund', diffHours: 24 };
  }
}

// 4-Hour Reschedule Cutoff Check
function getRescheduleEligibility(slotDateStr, slotStartTimeStr) {
  try {
    if (!slotDateStr || !slotStartTimeStr) return { allowed: true, diffHours: 24 };
    let yyyy, mm, dd;
    if (slotDateStr.includes('-') && slotDateStr.split('-')[0].length === 4) {
      [yyyy, mm, dd] = slotDateStr.split('-');
    } else {
      [dd, mm, yyyy] = slotDateStr.split('-');
    }
    const [hh, min] = slotStartTimeStr.split(':');
    const slotDate = new Date(+yyyy, +mm - 1, +dd, +hh, +min, 0, 0);
    const now = new Date();
    const diffHours = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    return {
      allowed: diffHours >= 4,
      diffHours,
      reason: diffHours < 4 ? `Rescheduling is locked within 4 hours of match time (${Math.max(0, Math.round(diffHours * 10) / 10)} hrs remaining)` : null,
    };
  } catch (e) {
    return { allowed: true, diffHours: 24 };
  }
}

export default function ManageBooking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('id') || searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Cancellation Modal State
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [isCancelSubmitting, setIsCancelSubmitting] = useState(false);

  // Reschedule Modal State
  const [reschedulingBooking, setReschedulingBooking] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(() => toDDMMYYYY(new Date()));
  const [stripStart, setStripStart] = useState(() => toDDMMYYYY(new Date()));
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isRescheduleSubmitting, setIsRescheduleSubmitting] = useState(false);

  const fetchBookings = async (queryToSearch) => {
    const q = (queryToSearch || searchInput).trim();
    if (!q) {
      setError('Please enter a Booking ID or Phone Number');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/bookings/lookup?query=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'No booking found matching your details');
      }
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : [data]);
      setSearchParams({ q });
    } catch (err) {
      console.error('Lookup booking error:', err);
      setBookings([]);
      setError(err.message || 'Failed to search booking');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      fetchBookings(initialQuery);
    }
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  // Cancel Booking Action
  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setIsCancelSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/bookings/${cancellingBooking._id}/cancel`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to cancel booking');
      }
      const data = await res.json();
      setSuccessMessage(data.message || 'Booking cancelled successfully.');
      setBookings((prev) =>
        prev.map((b) => (b._id === cancellingBooking._id ? data.booking : b))
      );
      setCancellingBooking(null);
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err) {
      setError(err.message || 'Error cancelling booking');
    } finally {
      setIsCancelSubmitting(false);
    }
  };

  // Fetch slots for Reschedule Date
  useEffect(() => {
    if (!reschedulingBooking) return;

    const groundId = reschedulingBooking.ground?._id || reschedulingBooking.ground;
    if (!groundId) return;

    async function loadSlots() {
      setLoadingSlots(true);
      setSelectedNewSlot(null);
      try {
        let res = await fetch(`${API_URL}/api/slots?groundId=${groundId}&date=${rescheduleDate}`);
        let data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          await fetch(`${API_URL}/api/slots/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groundId, date: rescheduleDate }),
          });
          res = await fetch(`${API_URL}/api/slots?groundId=${groundId}&date=${rescheduleDate}`);
          data = await res.json();
        }
        setAvailableSlots(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching reschedule slots:', err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [reschedulingBooking, rescheduleDate]);

  // Confirm Reschedule Action
  const handleConfirmReschedule = async () => {
    if (!reschedulingBooking || !selectedNewSlot) return;
    setIsRescheduleSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/bookings/${reschedulingBooking._id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newSlotId: selectedNewSlot._id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to reschedule booking');
      }

      const data = await res.json();
      setSuccessMessage('Match slot rescheduled successfully!');
      setBookings((prev) =>
        prev.map((b) => (b._id === reschedulingBooking._id ? data.booking : b))
      );
      setReschedulingBooking(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err.message || 'Could not reschedule slot');
    } finally {
      setIsRescheduleSubmitting(false);
    }
  };

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

  const handleDownloadCalendar = (booking) => {
    const groundName = booking.ground?.name || 'Green Box Cricket';
    const bookingId = `#TX${booking._id.slice(-6).toUpperCase()}`;
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:TurfX Match @ ${groundName}\nDESCRIPTION:Booking ${bookingId}\nSTATUS:CONFIRMED\nEND:VEVENT\nEND:VCALENDAR`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = `TurfX_${bookingId}.ics`;
    a.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] pb-24">
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-1.5 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Match Self-Service</span>
          </div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl lg:text-4xl text-on-surface tracking-tight">
            Manage Your Booking
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-sans">
            Enter your Booking ID or Phone Number to view, reschedule, or cancel your match.
          </p>
        </div>

        {/* Search Bar Form */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white rounded-3xl p-3 sm:p-4 border border-gray-200/80 shadow-sm max-w-xl mx-auto flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Booking ID (e.g. #TX9842) or Phone"
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-transparent hover:border-gray-200 focus:border-primary focus:outline-none text-sm text-on-surface placeholder:text-gray-400 bg-gray-50/70 focus:bg-white transition-all font-medium"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            className="py-3 px-6 bg-primary hover:bg-[#2d1eb3] text-white text-sm font-semibold rounded-2xl cursor-pointer shrink-0"
          >
            Search Booking
          </Button>
        </form>

        {/* Alerts */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-3 animate-fade-in max-w-xl mx-auto">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-error text-sm font-semibold flex items-center gap-3 animate-fade-in max-w-xl mx-auto">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Booking Results List */}
        {bookings.length > 0 && (
          <div className="space-y-6 pt-2 animate-fade-up">
            <h2 className="font-headline font-bold text-lg text-on-surface">
              Found {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'}
            </h2>

            <div className="space-y-5">
              {bookings.map((b) => {
                const groundName = b.ground?.name || 'Green Box Cricket';
                const groundLocation = b.ground?.location || 'Gachibowli, Hyderabad';
                const slot = b.slot;
                const slotDate = slot?.date || b.date;
                const timeStr = slot ? formatSlotRange(slot.startTime, slot.endTime) : '06:00 PM – 07:00 PM';
                const bookingCode = `#TX${b._id.slice(-6).toUpperCase()}`;
                const isCancelled = b.status === 'cancelled';
                const isRescheduled = b.status === 'rescheduled';

                // Check eligibility for cancellation & rescheduling
                const refundCalc = getRefundTier(slotDate, slot?.startTime, b.amount || 600);
                const rescheduleCalc = getRescheduleEligibility(slotDate, slot?.startTime);

                return (
                  <div
                    key={b._id}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6 transition-all hover:shadow-md"
                  >
                    {/* Top Row: Ground, ID, Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline font-bold text-xl sm:text-2xl text-on-surface">
                            {groundName}
                          </h3>
                          <span className="text-xs font-bold text-gray-400 font-mono">
                            {bookingCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          <span>{groundLocation}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider w-fit ${
                          isCancelled
                            ? 'bg-red-50 text-error border border-red-200'
                            : isRescheduled
                            ? 'bg-blue-50 text-primary border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isCancelled ? 'bg-error' : isRescheduled ? 'bg-primary' : 'bg-emerald-500 animate-pulse'
                          }`}
                        />
                        {b.status}
                      </span>
                    </div>

                    {/* Details 2x2 Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-sm">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Date
                        </span>
                        <div className="flex items-center gap-2 font-semibold text-on-surface">
                          <Calendar className="w-4 h-4 text-primary shrink-0" />
                          <span>{formatDisplayDate(slotDate)}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Time Slot
                        </span>
                        <div className="flex items-center gap-2 font-semibold text-on-surface">
                          <Clock className="w-4 h-4 text-primary shrink-0" />
                          <span>{timeStr}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Player
                        </span>
                        <p className="font-semibold text-on-surface truncate">
                          {b.customerName}
                        </p>
                        <p className="text-xs text-gray-400">{b.customerPhone}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Amount Paid
                        </span>
                        <p className="font-headline font-bold text-xl text-primary">
                          ₹{b.amount}
                        </p>
                        {b.refundAmount > 0 && (
                          <p className="text-xs font-bold text-emerald-600">
                            Refund: ₹{b.refundAmount} ({b.refundStatus})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions Row */}
                    {!isCancelled && (
                      <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadCalendar(b)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-on-surface text-xs font-semibold border border-gray-200 transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-primary" />
                            <span>Calendar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  groundName + ' ' + groundLocation
                                )}`,
                                '_blank'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-on-surface text-xs font-semibold border border-gray-200 transition-all cursor-pointer"
                          >
                            <Compass className="w-3.5 h-3.5 text-primary" />
                            <span>Directions</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Reschedule Button */}
                          <button
                            type="button"
                            onClick={() => setReschedulingBooking(b)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold transition-all cursor-pointer"
                          >
                            <span>Reschedule Match</span>
                          </button>

                          {/* Cancel Booking Button */}
                          <button
                            type="button"
                            onClick={() => setCancellingBooking(b)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-error border border-red-200 text-xs font-bold transition-all cursor-pointer"
                          >
                            <span>Cancel Booking</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* CANCELLATION MODAL WITH GRADUATED POLICY BREAKDOWN */}
      {cancellingBooking && (() => {
        const slot = cancellingBooking.slot;
        const slotDate = slot?.date || cancellingBooking.date;
        const refundInfo = getRefundTier(slotDate, slot?.startTime, cancellingBooking.amount || 600);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100 animate-slot-pop">
              
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 text-error flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-xl text-on-surface">
                      Cancel Match Booking
                    </h3>
                    <p className="text-xs text-gray-500 font-sans mt-0.5">
                      Booking #{cancellingBooking._id.slice(-6).toUpperCase()} • {cancellingBooking.ground?.name || 'Green Box Cricket'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCancellingBooking(null)}
                  className="p-1 rounded-xl text-gray-400 hover:text-on-surface hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Calculated Refund Banner */}
              {refundInfo.allowed ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Eligible Refund ({refundInfo.percentage}%)
                    </span>
                    <span className="font-headline font-bold text-xl text-emerald-700">
                      ₹{refundInfo.amount}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 font-medium">
                    {refundInfo.tier} · Submitted for venue admin approval.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-1">
                  <span className="text-xs font-bold text-error uppercase tracking-wider">
                    Cancellation Locked
                  </span>
                  <p className="text-xs text-error font-medium">
                    {refundInfo.reason}
                  </p>
                </div>
              )}

              {/* Graduated Policy Matrix Table */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Cancellation & Refund Rules
                </span>

                <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100 text-[11px]">
                  <div className={`p-2.5 flex justify-between ${refundInfo.percentage === 80 ? 'bg-emerald-50 font-bold text-emerald-800' : 'text-gray-600'}`}>
                    <span>&gt; 20 Hours before match</span>
                    <span>80% Refund (₹{Math.round((cancellingBooking.amount || 600) * 0.8)})</span>
                  </div>
                  <div className={`p-2.5 flex justify-between ${refundInfo.percentage === 60 ? 'bg-blue-50 font-bold text-primary' : 'text-gray-600'}`}>
                    <span>12 – 20 Hours before match</span>
                    <span>60% Refund (₹{Math.round((cancellingBooking.amount || 600) * 0.6)})</span>
                  </div>
                  <div className={`p-2.5 flex justify-between ${refundInfo.percentage === 40 ? 'bg-amber-50 font-bold text-amber-800' : 'text-gray-600'}`}>
                    <span>6 – 12 Hours before match</span>
                    <span>40% Refund (₹{Math.round((cancellingBooking.amount || 600) * 0.4)})</span>
                  </div>
                  <div className={`p-2.5 flex justify-between ${refundInfo.percentage === 0 && refundInfo.allowed ? 'bg-red-50 font-bold text-error' : 'text-gray-600'}`}>
                    <span>2 – 6 Hours before match</span>
                    <span>0% (Non-refundable)</span>
                  </div>
                  <div className="p-2.5 flex justify-between text-gray-400 bg-gray-50">
                    <span>&lt; 2 Hours before match</span>
                    <span>Cancellation Closed</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingBooking(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Keep Booking
                </button>

                {refundInfo.allowed && (
                  <Button
                    onClick={handleConfirmCancel}
                    loading={isCancelSubmitting}
                    className="px-5 py-2.5 bg-error hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Confirm Cancellation
                  </Button>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* RESCHEDULE MODAL WITH 4-HOUR RULE */}
      {reschedulingBooking && (() => {
        const slot = reschedulingBooking.slot;
        const slotDate = slot?.date || reschedulingBooking.date;
        const rescheduleCheck = getRescheduleEligibility(slotDate, slot?.startTime);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100 animate-slot-pop">
              
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-headline font-bold text-xl text-on-surface">
                    Reschedule Match
                  </h3>
                  <p className="text-xs text-gray-500 font-sans mt-0.5">
                    Pick a new date and available slot for {reschedulingBooking.ground?.name || 'Green Box Cricket'}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setReschedulingBooking(null)}
                  className="p-1 rounded-xl text-gray-400 hover:text-on-surface hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 4-Hour Rule Alert */}
              {!rescheduleCheck.allowed ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4" /> Reschedule Locked
                  </div>
                  <p className="text-xs text-amber-800 font-medium">
                    {rescheduleCheck.reason}. Rescheduling is only permitted at least 4 hours prior to match time.
                  </p>
                </div>
              ) : (
                <>
                  {/* 7-Day Date Strip */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Select New Date
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {stripDays.map((d) => (
                        <button
                          key={d.dateStr}
                          type="button"
                          disabled={d.isPast}
                          onClick={() => setRescheduleDate(d.dateStr)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl min-w-[3.75rem] transition-all cursor-pointer ${
                            rescheduleDate === d.dateStr
                              ? 'bg-primary text-white shadow-md'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          } ${d.isPast ? 'opacity-30 cursor-not-allowed' : ''}`}
                        >
                          <span className="text-[10px] font-bold uppercase">{d.label}</span>
                          <span className="font-headline font-bold text-lg leading-tight mt-0.5">{d.day}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Available Slots Grid */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Available Slots for {formatDisplayDate(rescheduleDate)}
                    </span>

                    {loadingSlots ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 py-4 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="h-12 bg-gray-100 rounded-xl"></div>
                        ))}
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-400">
                        No slots available for this date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
                        {availableSlots.map((slot) => {
                          const isBooked = slot.status === 'booked';
                          const isBlocked = slot.status === 'blocked';
                          const isSelected = selectedNewSlot?._id === slot._id;

                          if (isBooked || isBlocked) {
                            return (
                              <div
                                key={slot._id}
                                className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-center opacity-40 select-none text-xs"
                              >
                                <p className="font-medium text-gray-400">{fmt12(slot.startTime)}</p>
                                <span className="text-[9px] uppercase font-bold text-gray-400">{slot.status}</span>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={slot._id}
                              type="button"
                              onClick={() => setSelectedNewSlot(slot)}
                              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-primary text-white border-primary shadow-sm font-bold'
                                  : 'bg-white border-emerald-500/60 hover:border-emerald-600 hover:bg-emerald-50/50 text-on-surface'
                              }`}
                            >
                              <p className="font-semibold text-xs">{fmt12(slot.startTime)}</p>
                              <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-emerald-700 font-bold'}`}>
                                Available
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedulingBooking(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>

                {rescheduleCheck.allowed && (
                  <Button
                    disabled={!selectedNewSlot}
                    onClick={handleConfirmReschedule}
                    loading={isRescheduleSubmitting}
                    className="px-5 py-2.5 bg-primary hover:bg-[#2d1eb3] text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    Confirm Reschedule
                  </Button>
                )}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
