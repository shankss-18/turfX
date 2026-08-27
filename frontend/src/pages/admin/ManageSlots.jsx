import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  CalendarDays,
  Wrench,
  Clock,
  Lock,
  Unlock,
  Check,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
  Eye,
  X,
  User,
  Phone,
  Mail,
  CreditCard,
  History,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/common/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function formatSlotTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 && h < 24 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

// Convert YYYY-MM-DD <-> DD-MM-YYYY
function toDDMMYYYY(yyyyMmDd) {
  if (!yyyyMmDd) return '';
  const [yyyy, mm, dd] = yyyyMmDd.split('-');
  return `${dd}-${mm}-${yyyy}`;
}

// Check if a slot is strictly in the past
function isSlotPast(slot, dateStr) {
  try {
    let yyyy, mm, dd;
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
      [yyyy, mm, dd] = dateStr.split('-');
    } else {
      [dd, mm, yyyy] = dateStr.split('-');
    }
    const [hh, min] = slot.startTime.split(':');
    const slotDate = new Date(+yyyy, +mm - 1, +dd, +hh, +min, 0, 0);
    return slotDate <= new Date();
  } catch {
    return false;
  }
}

export default function ManageSlots() {
  const navigate = useNavigate();

  const [ground, setGround] = useState(null);
  const [dateInput, setDateInput] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // "YYYY-MM-DD"
  });

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updatingSlotId, setUpdatingSlotId] = useState(null);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Selected Booking Details Modal State
  const [selectedSlotBooking, setSelectedSlotBooking] = useState(null);
  const [loadingBookingDetails, setLoadingBookingDetails] = useState(false);
  const [modalSlot, setModalSlot] = useState(null);

  // Check auth and fetch ground on mount
  useEffect(() => {
    const token = localStorage.getItem('turfx_admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    async function loadGround() {
      try {
        const res = await fetch(`${API_URL}/api/grounds`);
        if (!res.ok) throw new Error('Failed to load ground');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setGround(data[0]);
        }
      } catch (err) {
        console.error('ManageSlots: ground fetch error:', err);
        setError('Failed to load ground information');
      }
    }

    loadGround();
  }, [navigate]);

  // Fetch slots for selected date
  const fetchSlots = useCallback(async () => {
    const token = localStorage.getItem('turfx_admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    if (!ground?._id) return;

    setLoading(true);
    setError(null);

    const dateFormatted = toDDMMYYYY(dateInput);

    try {
      const res = await fetch(`${API_URL}/api/slots?groundId=${ground._id}&date=${dateFormatted}`);
      if (!res.ok) {
        throw new Error(`Failed to load slots (Status: ${res.status})`);
      }
      const data = await res.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('ManageSlots: slots fetch error:', err);
      setError(err.message || 'Error loading slots');
    } finally {
      setLoading(false);
    }
  }, [ground?._id, dateInput, navigate]);

  useEffect(() => {
    if (ground?._id) {
      fetchSlots();
    }
  }, [ground?._id, fetchSlots]);

  // Block / Unblock / Cancel slot handler
  const handleToggleSlotStatus = async (slot) => {
    // Check if slot has already passed
    if (isSlotPast(slot, dateInput)) {
      setError('Cannot modify a slot whose time has already passed.');
      return;
    }

    const token = localStorage.getItem('turfx_admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const nextStatus = slot.status === 'blocked' ? 'available' : slot.status === 'booked' ? 'available' : 'blocked';
    setUpdatingSlotId(slot._id);

    // Optimistic UI update
    setSlots((prev) =>
      prev.map((s) => (s._id === slot._id ? { ...s, status: nextStatus } : s))
    );

    try {
      const res = await fetch(`${API_URL}/api/slots/${slot._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update slot status');
      }

      setFeedback({
        type: 'success',
        message: slot.status === 'booked'
          ? `Booking for ${formatSlotTime(slot.startTime)} cancelled & slot is now AVAILABLE!`
          : `Slot ${formatSlotTime(slot.startTime)} is now ${nextStatus.toUpperCase()}`,
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Toggle slot error:', err);
      // Rollback optimistic update
      setSlots((prev) =>
        prev.map((s) => (s._id === slot._id ? { ...s, status: slot.status } : s))
      );
      setError(err.message || 'Could not update slot');
    } finally {
      setUpdatingSlotId(null);
    }
  };

  // View Booking Details Modal
  const handleOpenBookingDetails = async (slot) => {
    const token = localStorage.getItem('turfx_admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    setModalSlot(slot);
    setSelectedSlotBooking(null);
    setLoadingBookingDetails(true);

    try {
      const res = await fetch(`${API_URL}/api/slots/${slot._id}/booking`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Could not retrieve booking details for this slot');
      }

      const bookingData = await res.json();
      setSelectedSlotBooking(bookingData);
    } catch (err) {
      console.error('View booking details error:', err);
      setSelectedSlotBooking({
        error: 'No active booking record found or booking details could not be loaded.',
      });
    } finally {
      setLoadingBookingDetails(false);
    }
  };

  // Generate slots for empty dates
  const handleGenerateSlots = async () => {
    const token = localStorage.getItem('turfx_admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    if (!ground?._id) return;

    setGenerating(true);
    setFeedback(null);
    setError(null);

    const dateFormatted = toDDMMYYYY(dateInput);

    try {
      const res = await fetch(`${API_URL}/api/slots/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groundId: ground._id,
          date: dateFormatted,
        }),
      });

      const data = await res.json();
      setFeedback({
        type: 'success',
        message: data.message || `Slots successfully generated for ${dateFormatted}!`,
      });

      await fetchSlots();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('ManageSlots: generate error:', err);
      setError(err.message || 'Failed to generate slots');
    } finally {
      setGenerating(false);
    }
  };

  // Compute counters
  const counters = useMemo(() => {
    let available = 0;
    let booked = 0;
    let blocked = 0;

    slots.forEach((s) => {
      if (s.status === 'booked') booked++;
      else if (s.status === 'blocked') blocked++;
      else available++;
    });

    return {
      available,
      booked,
      blocked,
    };
  }, [slots]);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 max-w-7xl">
        
        {/* HEADER & DATE SELECTOR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline font-bold text-2xl sm:text-3xl text-on-surface tracking-tight">
                Slot Management
              </h1>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
                Green Box Cricket
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant font-sans mt-1">
              Manage slots, block maintenance hours, cancel reservations, or inspect customer bookings.
            </p>
          </div>

          {/* Date Picker */}
          <div className="space-y-1 self-start sm:self-auto">
            <label className="block text-[11px] font-sans font-semibold text-gray-500 uppercase tracking-wider">
              Select Date
            </label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-white cursor-pointer shadow-xs"
            />
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="p-4 rounded-xl border text-sm font-semibold flex items-center gap-3 bg-emerald-50 text-[#006c49] border-emerald-200 animate-in fade-in">
            <Check className="w-4 h-4 text-secondary shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl border text-sm font-semibold flex items-center justify-between gap-3 bg-red-50 text-error border-red-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchSlots}
              className="inline-flex items-center gap-1 text-xs font-bold underline cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* TOP 3 SUMMARY STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Available */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-surface-1 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-[#6cf8bb]/20 border border-[#6cf8bb]/40 flex items-center justify-center text-[#006c49] flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Available
              </p>
              <p className="font-headline font-bold text-2xl sm:text-3xl text-on-surface mt-0.5">
                {counters.available}
              </p>
            </div>
          </div>

          {/* Card 2: Booked */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-surface-1 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-primary flex-shrink-0">
              <CalendarDays className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Booked
              </p>
              <p className="font-headline font-bold text-2xl sm:text-3xl text-on-surface mt-0.5">
                {counters.booked}
              </p>
            </div>
          </div>

          {/* Card 3: Blocked */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-surface-1 flex items-center gap-5">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-[#885500] flex-shrink-0">
              <Wrench className="w-6 h-6 text-[#885500]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Blocked
              </p>
              <p className="font-headline font-bold text-2xl sm:text-3xl text-on-surface mt-0.5">
                {counters.blocked}
              </p>
            </div>
          </div>
        </div>

        {/* SLOTS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-gray-200 p-4"></div>
            ))}
          </div>
        ) : slots.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-gray-200/80 text-center space-y-4 shadow-surface-1">
            <CalendarDays className="w-10 h-10 text-gray-400 mx-auto" />
            <div>
              <p className="font-headline font-bold text-lg text-on-surface">
                No slots generated for {toDDMMYYYY(dateInput)}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                Generate the schedule to view and manage match slots for Green Box Cricket.
              </p>
            </div>
            <Button
              onClick={handleGenerateSlots}
              loading={generating}
              className="px-6 py-2.5 bg-primary hover:bg-[#2d1eb3] text-white cursor-pointer"
            >
              Generate Schedule for {toDDMMYYYY(dateInput)}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {slots.map((slot) => {
              const isBooked = slot.status === 'booked';
              const isBlocked = slot.status === 'blocked';
              const isPast = isSlotPast(slot, dateInput);
              const isUpdating = updatingSlotId === slot._id;

              return (
                <div
                  key={slot._id}
                  className={`bg-white rounded-2xl p-5 border transition-all space-y-3.5 flex flex-col justify-between ${
                    isPast
                      ? 'bg-gray-50/90 border-gray-200 opacity-60'
                      : isBooked
                      ? 'bg-blue-50/30 border-blue-200 shadow-sm'
                      : isBlocked
                      ? 'border-amber-300 bg-amber-50/30 shadow-sm'
                      : 'border-gray-200 shadow-sm hover:border-primary/40 hover:shadow-md'
                  }`}
                >
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {isPast ? (
                        <div className="w-8 h-8 rounded-lg bg-gray-200/80 flex items-center justify-center text-gray-400 shrink-0">
                          <History className="w-4 h-4" />
                        </div>
                      ) : isBooked ? (
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-primary shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                      ) : isBlocked ? (
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                          <Wrench className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <p className={`font-headline font-bold text-sm sm:text-base ${isPast ? 'text-gray-500 line-through' : 'text-on-surface'}`}>
                          {formatSlotTime(slot.startTime)}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          {slot.endTime ? `${slot.startTime} – ${slot.endTime}` : '60 mins'}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isPast
                          ? 'bg-gray-200 text-gray-600'
                          : isBooked
                          ? 'bg-blue-100 text-primary border border-blue-200'
                          : isBlocked
                          ? 'bg-amber-100 text-[#885500] border border-amber-200'
                          : 'bg-emerald-100 text-[#006c49] border border-emerald-200'
                      }`}
                    >
                      {isPast ? (isBooked ? 'Past (Booked)' : 'Expired') : slot.status}
                    </span>
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-2">
                    <span className="font-headline font-bold text-base text-on-surface">
                      ₹{slot.price}
                    </span>

                    {/* Action controls based on past/future and status */}
                    <div className="flex items-center gap-1.5">
                      {isPast ? (
                        isBooked ? (
                          <button
                            type="button"
                            onClick={() => handleOpenBookingDetails(slot)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                            title="View past booking information"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium italic">
                            Past Slot
                          </span>
                        )
                      ) : isBooked ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenBookingDetails(slot)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                            title="View customer booking details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleToggleSlotStatus(slot)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-error border border-red-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                            title="Cancel booking and free this slot"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>{isUpdating ? 'Saving...' : 'Cancel'}</span>
                          </button>
                        </>
                      ) : isBlocked ? (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleToggleSlotStatus(slot)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>{isUpdating ? 'Saving...' : 'Unblock'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleToggleSlotStatus(slot)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                          <span>{isUpdating ? 'Saving...' : 'Block'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* BOOKING DETAILS MODAL */}
      {modalSlot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 animate-slot-pop space-y-0">
            
            {/* Modal Header */}
            <div className="bg-primary text-white p-5 sm:p-6 flex items-start justify-between sticky top-0 z-10">
              <div>
                <span className="text-xs uppercase font-bold text-white/75 tracking-wider">
                  Slot Booking Details
                </span>
                <h3 className="font-headline font-bold text-xl sm:text-2xl mt-0.5">
                  {formatSlotTime(modalSlot.startTime)} – {formatSlotTime(modalSlot.endTime || '07:00')}
                </h3>
                <p className="text-xs text-white/80 mt-1 font-sans">
                  {toDDMMYYYY(dateInput)} • Green Box Cricket
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setModalSlot(null);
                  setSelectedSlotBooking(null);
                }}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {loadingBookingDetails ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-gray-500 font-medium">Loading customer reservation details...</p>
                </div>
              ) : selectedSlotBooking?.error ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  {selectedSlotBooking.error}
                </div>
              ) : selectedSlotBooking ? (
                <div className="space-y-5 text-sm">
                  
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                    <div>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Booking ID
                      </span>
                      <p className="font-mono font-bold text-base text-primary">
                        #{selectedSlotBooking._id ? selectedSlotBooking._id.slice(-6).toUpperCase() : 'TX'}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        selectedSlotBooking.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {selectedSlotBooking.status}
                    </span>
                  </div>

                  {/* Customer Information Box */}
                  <div className="space-y-3 border-y border-gray-100 py-4">
                    <h4 className="font-headline font-bold text-xs text-gray-400 uppercase tracking-wider">
                      Customer Information
                    </h4>

                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Player Name</p>
                          <p className="font-semibold text-on-surface">{selectedSlotBooking.customerName || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Phone</p>
                          <a
                            href={`tel:${selectedSlotBooking.customerPhone}`}
                            className="font-semibold text-primary hover:underline"
                          >
                            {selectedSlotBooking.customerPhone || 'N/A'}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Email</p>
                          <p className="font-semibold text-on-surface">{selectedSlotBooking.customerEmail || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="space-y-2">
                    <h4 className="font-headline font-bold text-xs text-gray-400 uppercase tracking-wider">
                      Payment Breakdown
                    </h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Amount Paid</span>
                      <span className="font-headline font-bold text-lg text-primary">
                        ₹{selectedSlotBooking.amount || 600}
                      </span>
                    </div>
                    {selectedSlotBooking.razorpayPaymentId && (
                      <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
                        <span>Payment Ref</span>
                        <span>{selectedSlotBooking.razorpayPaymentId}</span>
                      </div>
                    )}
                  </div>

                  {/* Action inside Modal if slot is in the future */}
                  {!isSlotPast(modalSlot, dateInput) && selectedSlotBooking.status !== 'cancelled' && (
                    <div className="pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={async () => {
                          await handleToggleSlotStatus(modalSlot);
                          setModalSlot(null);
                          setSelectedSlotBooking(null);
                        }}
                        className="w-full py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-error border border-red-200 font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Cancel Booking & Refund Slot</span>
                      </button>
                    </div>
                  )}

                </div>
              ) : null}

              {/* Close Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalSlot(null);
                    setSelectedSlotBooking(null);
                  }}
                  className="w-full py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-on-surface font-semibold text-sm transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </AdminLayout>
  );
}
