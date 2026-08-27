import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Calendar,
  Clock,
  User,
  Phone,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Search,
  Check,
  X,
  History,
  ShieldAlert,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/common/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function formatDisplayDate(dateStr) {
  if (!dateStr) return 'Match Date';
  let d;
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[2]?.length === 4) {
      const [dd, mm, yyyy] = parts;
      d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    } else {
      d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
    }
  } else {
    d = new Date(dateStr);
  }
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatSlotTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 && h < 24 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export default function AdminRefunds() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchRecords = useCallback(async () => {
    const token = localStorage.getItem('turfx_admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/bookings/audit`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('turfx_admin_token');
        navigate('/admin/login');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch refund and audit records');
      }

      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch audits error:', err);
      setError(err.message || 'Error loading refund requests');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Handle Approve Refund
  const handleApproveRefund = async (bookingId, amount) => {
    const token = localStorage.getItem('turfx_admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    setProcessingId(bookingId);
    try {
      const res = await fetch(`${API_URL}/api/bookings/${bookingId}/approve-refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to approve refund');
      const data = await res.json();

      setRecords((prev) =>
        prev.map((r) => (r._id === bookingId ? data.booking : r))
      );

      setFeedback({
        type: 'success',
        message: `Refund of ₹${amount} approved successfully!`,
      });
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error('Approve refund error:', err);
      setError(err.message || 'Could not approve refund');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Reject Refund
  const handleRejectRefund = async (bookingId) => {
    if (!window.confirm('Are you sure you want to reject this refund request?')) return;

    const token = localStorage.getItem('turfx_admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    setProcessingId(bookingId);
    try {
      const res = await fetch(`${API_URL}/api/bookings/${bookingId}/reject-refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to reject refund');
      const data = await res.json();

      setRecords((prev) =>
        prev.map((r) => (r._id === bookingId ? data.booking : r))
      );

      setFeedback({
        type: 'warning',
        message: 'Refund request was rejected.',
      });
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error('Reject refund error:', err);
      setError(err.message || 'Could not reject refund');
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        (r.customerName && r.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.customerPhone && r.customerPhone.includes(searchQuery)) ||
        (r._id && r._id.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === 'pending') {
        matchesStatus = r.refundStatus === 'pending' || r.paymentStatus === 'refund_pending';
      } else if (statusFilter === 'approved') {
        matchesStatus = r.refundStatus === 'approved' || r.paymentStatus === 'refunded';
      } else if (statusFilter === 'rejected') {
        matchesStatus = r.refundStatus === 'rejected';
      } else if (statusFilter === 'rescheduled') {
        matchesStatus = r.status === 'rescheduled';
      }

      return matchesSearch && matchesStatus;
    });
  }, [records, searchQuery, statusFilter]);

  // Group by Match Date
  const groupedByDate = useMemo(() => {
    const groups = {};

    filteredRecords.forEach((rec) => {
      const slotDate = rec.slot?.date || rec.date || (rec.createdAt ? rec.createdAt.split('T')[0] : 'General');
      if (!groups[slotDate]) {
        groups[slotDate] = [];
      }
      groups[slotDate].push(rec);
    });

    return Object.entries(groups).map(([dateKey, items]) => {
      const pendingCount = items.filter((i) => i.refundStatus === 'pending').length;
      const totalRefundForDate = items.reduce((sum, i) => sum + (i.refundAmount || 0), 0);
      return {
        dateKey,
        items,
        pendingCount,
        totalRefundForDate,
      };
    });
  }, [filteredRecords]);

  // Top Metrics
  const metrics = useMemo(() => {
    const pendingList = records.filter(
      (r) => r.refundStatus === 'pending' || (r.status === 'cancelled' && r.refundAmount > 0 && r.refundStatus !== 'approved' && r.refundStatus !== 'rejected')
    );
    const pendingCount = pendingList.length;
    const pendingAmount = pendingList.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
    const rescheduledCount = records.filter((r) => r.status === 'rescheduled').length;
    const approvedCount = records.filter((r) => r.refundStatus === 'approved').length;

    return {
      pendingCount,
      pendingAmount,
      rescheduledCount,
      approvedCount,
    };
  }, [records]);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 max-w-7xl">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-on-surface tracking-tight">
              Refunds & Audit Log
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant font-sans mt-1">
              Trace cancelled and rescheduled match slots, inspect graduated refund calculations, and approve refunds grouped by dates.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchRecords}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-xs text-xs font-bold text-on-surface hover:bg-gray-50 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit</span>
          </button>
        </div>

        {/* FEEDBACK & ERROR ALERTS */}
        {feedback && (
          <div className="p-4 rounded-xl border text-sm font-semibold flex items-center gap-3 bg-emerald-50 text-[#006c49] border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl border text-sm font-semibold flex items-center justify-between gap-3 bg-red-50 text-error border-red-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchRecords} className="text-xs font-bold underline cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* TOP 4 SUMMARY METRIC CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Metric 1: Pending Approvals */}
          <div className="bg-white rounded-2xl p-5 border-2 border-amber-300 bg-amber-50/20 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Pending Approvals
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <p className="font-headline font-bold text-2xl sm:text-3xl text-on-surface">
              {metrics.pendingCount}
            </p>
          </div>

          {/* Metric 2: Pending Refund Amount */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Pending Refund (₹)
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <p className="font-headline font-bold text-2xl sm:text-3xl text-primary">
              ₹{metrics.pendingAmount.toLocaleString()}
            </p>
          </div>

          {/* Metric 3: Rescheduled Matches */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Rescheduled Slots
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
            </div>
            <p className="font-headline font-bold text-2xl sm:text-3xl text-on-surface">
              {metrics.rescheduledCount}
            </p>
          </div>

          {/* Metric 4: Approved Refunds */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Approved Refunds
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <p className="font-headline font-bold text-2xl sm:text-3xl text-secondary">
              {metrics.approvedCount}
            </p>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3 sm:gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone, or booking ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-surface-low/30"
            />
          </div>

          <div className="w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-on-surface focus:outline-none focus:border-primary bg-surface-low/30 cursor-pointer"
            >
              <option value="all">All Request Types</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved / Refunded</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* AUDIT LOG GROUPED BY DATES */}
        {loading ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2].map((g) => (
              <div key={g} className="bg-white rounded-3xl p-6 border border-gray-200 h-48"></div>
            ))}
          </div>
        ) : groupedByDate.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-gray-200 text-center space-y-3">
            <Receipt className="w-10 h-10 text-gray-400 mx-auto" />
            <p className="font-headline font-bold text-lg text-on-surface">
              No cancelled or rescheduled matches found
            </p>
            <p className="text-xs text-gray-400">
              When players cancel or reschedule slots, they will appear here grouped by match dates for approval.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedByDate.map(({ dateKey, items, pendingCount, totalRefundForDate }) => (
              <div
                key={dateKey}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden"
              >
                {/* Date Group Header */}
                <div className="bg-gray-50/80 px-5 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-base text-on-surface">
                        {formatDisplayDate(dateKey)}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {items.length} {items.length === 1 ? 'event' : 'events'} recorded for this date
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto">
                    {pendingCount > 0 && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        {pendingCount} Pending Approval
                      </span>
                    )}
                    <span className="text-xs font-semibold text-gray-500">
                      Total Refund: <strong className="text-on-surface font-headline font-bold">₹{totalRefundForDate}</strong>
                    </span>
                  </div>
                </div>

                {/* 1. MOBILE RESPONSIVE CARDS VIEW (visible on < lg) */}
                <div className="lg:hidden p-4 sm:p-5 space-y-4 divide-y divide-gray-100">
                  {items.map((item) => {
                    const isRescheduled = item.status === 'rescheduled';
                    const isPending =
                      item.refundStatus === 'pending' ||
                      (item.status === 'cancelled' && item.refundAmount > 0 && item.refundStatus !== 'approved' && item.refundStatus !== 'rejected');
                    const isApproved = item.refundStatus === 'approved';
                    const isRejected = item.refundStatus === 'rejected';

                    const slotTime = item.slot
                      ? `${formatSlotTime(item.slot.startTime)} – ${formatSlotTime(item.slot.endTime || '07:00')}`
                      : 'Match Slot';

                    const bookingIdShort = `#${item._id ? item._id.slice(-6).toUpperCase() : 'TX'}`;

                    return (
                      <div key={item._id} className="pt-4 first:pt-0 space-y-3.5">
                        {/* Header: ID, Name, Status */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono text-xs font-bold text-primary">{bookingIdShort}</span>
                            <h4 className="font-headline font-bold text-base text-on-surface">{item.customerName || 'Player'}</h4>
                            <p className="text-xs text-gray-400">{item.customerPhone || 'N/A'}</p>
                          </div>

                          <div>
                            {isRescheduled ? (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-blue-50 text-blue-700 border border-blue-200">
                                Rescheduled
                              </span>
                            ) : isApproved ? (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Approved
                              </span>
                            ) : isRejected ? (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-red-100 text-red-800 border border-red-200">
                                Rejected
                              </span>
                            ) : isPending && (item.refundAmount || 0) > 0 ? (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-amber-100 text-amber-800 border border-amber-200">
                                Pending
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-gray-100 text-gray-700 border border-gray-200">
                                Cancelled
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Match & Policy Info */}
                        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50/80 rounded-xl text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Match Time</span>
                            <p className="font-semibold text-on-surface mt-0.5">{slotTime}</p>
                            <p className="text-[11px] text-gray-500">{item.ground?.name || 'Green Box Cricket'}</p>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Eligible Refund</span>
                            <p className="font-headline font-bold text-base text-primary mt-0.5">
                              {isRescheduled ? 'Shifted' : `₹${item.refundAmount || 0}`}
                            </p>
                            <p className="text-[10px] text-gray-400">Paid: ₹{item.amount || 600}</p>
                          </div>
                        </div>

                        {/* Policy Calculation Text */}
                        <div className="text-xs text-gray-600">
                          {isRescheduled ? (
                            <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                              <History className="w-3.5 h-3.5" /> Rescheduled (&gt; 4 hrs rule)
                            </span>
                          ) : (
                            <p className="font-medium">
                              {item.cancellationTier || `${item.refundPercentage || 0}% Refund Tier`}
                              {item.hoursBeforeCancellation != null && ` · Cancelled ${item.hoursBeforeCancellation} hrs prior`}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        {isPending && (item.refundAmount || 0) > 0 && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              disabled={processingId === item._id}
                              onClick={() => handleApproveRefund(item._id, item.refundAmount)}
                              className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve (₹{item.refundAmount})</span>
                            </button>

                            <button
                              type="button"
                              disabled={processingId === item._id}
                              onClick={() => handleRejectRefund(item._id)}
                              className="py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-error border border-red-200 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 2. DESKTOP SPACIOUS TABLE VIEW (visible on >= lg) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-white">
                        <th className="py-4 px-6">ID & Player</th>
                        <th className="py-4 px-6">Slot Time</th>
                        <th className="py-4 px-6">Policy Tier & Calculation</th>
                        <th className="py-4 px-6">Refund Amount</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Admin Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {items.map((item) => {
                        const isRescheduled = item.status === 'rescheduled';
                        const isPending =
                          item.refundStatus === 'pending' ||
                          (item.status === 'cancelled' && item.refundAmount > 0 && item.refundStatus !== 'approved' && item.refundStatus !== 'rejected');
                        const isApproved = item.refundStatus === 'approved';
                        const isRejected = item.refundStatus === 'rejected';

                        const slotTime = item.slot
                          ? `${formatSlotTime(item.slot.startTime)} – ${formatSlotTime(item.slot.endTime || '07:00')}`
                          : 'Match Slot';

                        const bookingIdShort = `#${item._id ? item._id.slice(-6).toUpperCase() : 'TX'}`;

                        return (
                          <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                            {/* Player Info */}
                            <td className="py-4 px-6">
                              <p className="font-mono text-xs font-bold text-primary">
                                {bookingIdShort}
                              </p>
                              <p className="font-semibold text-on-surface text-sm mt-0.5">
                                {item.customerName || 'Player'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {item.customerPhone || 'N/A'}
                              </p>
                            </td>

                            {/* Slot Time */}
                            <td className="py-4 px-6">
                              <p className="font-semibold text-on-surface">
                                {slotTime}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {item.ground?.name || 'Green Box Cricket'}
                              </p>
                              {isRescheduled && item.previousSlot && (
                                <p className="text-[11px] text-blue-600 font-medium mt-1">
                                  Rescheduled from earlier slot
                                </p>
                              )}
                            </td>

                            {/* Policy Tier */}
                            <td className="py-4 px-6">
                              {isRescheduled ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                                  <History className="w-3.5 h-3.5" />
                                  Rescheduled (&gt; 4 hrs rule)
                                </span>
                              ) : (
                                <div>
                                  <p className="font-semibold text-xs text-on-surface">
                                    {item.cancellationTier || `${item.refundPercentage || 0}% Refund Tier`}
                                  </p>
                                  {item.hoursBeforeCancellation != null && (
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                      Cancelled {item.hoursBeforeCancellation} hrs prior
                                    </p>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Refund Amount */}
                            <td className="py-4 px-6">
                              {isRescheduled ? (
                                <span className="text-xs text-gray-400 italic">Slot Shifted</span>
                              ) : (
                                <div>
                                  <p className="font-headline font-bold text-base text-primary">
                                    ₹{item.refundAmount || 0}
                                  </p>
                                  <p className="text-[11px] text-gray-400">
                                    Paid: ₹{item.amount || 600}
                                  </p>
                                </div>
                              )}
                            </td>

                            {/* Status Badge */}
                            <td className="py-4 px-6">
                              {isRescheduled ? (
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                                  Rescheduled
                                </span>
                              ) : isApproved ? (
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Approved
                                </span>
                              ) : isRejected ? (
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
                                  Rejected
                                </span>
                              ) : isPending && (item.refundAmount || 0) > 0 ? (
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                  Pending Approval
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
                                  Cancelled (0%)
                                </span>
                              )}
                            </td>

                            {/* Admin Action Buttons */}
                            <td className="py-4 px-6 text-right">
                              {isPending && (item.refundAmount || 0) > 0 ? (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={processingId === item._id}
                                    onClick={() => handleApproveRefund(item._id, item.refundAmount)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>

                                  <button
                                    type="button"
                                    disabled={processingId === item._id}
                                    onClick={() => handleRejectRefund(item._id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-error border border-red-200 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium italic">
                                  {isApproved ? 'Processed' : isRejected ? 'Declined' : 'Logged'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
