import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  AlertCircle,
  RotateCcw,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  X,
  Plus,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import Badge from '../../components/common/Badge';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function formatTableDate(dateStr) {
  if (!dateStr) return 'Oct 24, 2026';
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

function toDDMMYYYY(yyyyMmDd) {
  if (!yyyyMmDd) return '';
  const [yyyy, mm, dd] = yyyyMmDd.split('-');
  return `${dd}-${mm}-${yyyy}`;
}

export default function BookingsList() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Cancel action state
  const [cancellingId, setCancellingId] = useState(null);

  // Fetch Bookings with admin token
  const fetchBookings = useCallback(async () => {
    const token = localStorage.getItem('turfx_admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/bookings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('turfx_admin_token');
        navigate('/admin/login');
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch bookings (Status: ${res.status})`);
      }

      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('BookingsList fetch error:', err);
      setError(err.message || 'Error loading bookings from server');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        !searchQuery ||
        (b.customerName && b.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.customerPhone && b.customerPhone.includes(searchQuery)) ||
        (b._id && b._id.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesDate = true;
      if (dateFilter) {
        const targetDDMMYYYY = toDDMMYYYY(dateFilter);
        const bSlotDate = b.slot?.date || b.date;
        matchesDate = bSlotDate === targetDDMMYYYY || bSlotDate === dateFilter || (b.createdAt && b.createdAt.startsWith(dateFilter));
      }

      const matchesStatus =
        statusFilter === 'all' ||
        (b.paymentStatus || 'pending').toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [bookings, searchQuery, dateFilter, statusFilter]);

  // Paginated items
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(start, start + itemsPerPage);
  }, [filteredBookings, currentPage]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;

  // CSV Export handler
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) return;
    const headers = ['Booking ID,Customer Name,Phone,Email,Ground,Date,Time,Amount,Status\n'];
    const rows = filteredBookings.map((b) => {
      const id = b._id;
      const name = `"${b.customerName || ''}"`;
      const phone = `"${b.customerPhone || ''}"`;
      const email = `"${b.customerEmail || ''}"`;
      const ground = `"${b.ground?.name || 'Green Box Cricket'}"`;
      const date = b.slot?.date || b.date || '';
      const time = b.slot ? `${b.slot.startTime} - ${b.slot.endTime}` : '';
      const amount = b.amount || 0;
      const status = b.paymentStatus || 'pending';
      return `${id},${name},${phone},${email},${ground},${date},${time},${amount},${status}`;
    });

    const csvBlob = new Blob([headers.concat(rows).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TurfX_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct Cancel Booking by Admin
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking and free the slot?')) {
      return;
    }

    const token = localStorage.getItem('turfx_admin_token');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    setCancellingId(bookingId);
    try {
      const res = await fetch(`${API_URL}/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to cancel booking');
      }

      const data = await res.json();
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? data.booking : b))
      );
    } catch (err) {
      console.error('Cancel error:', err);
      alert(err.message || 'Could not cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 max-w-7xl">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight">
              Bookings
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant font-sans mt-1">
              Manage, inspect customer details, and cancel match reservations.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-xs font-bold text-on-surface shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-error text-sm font-semibold flex items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchBookings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-error text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* SEARCH & FILTER CONTROLS TOOLBAR */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3 sm:gap-4">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, phone, or ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-on-surface placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all bg-surface-low/30"
            />
          </div>

          {/* Date Picker Filter */}
          <div className="w-full md:w-auto">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-on-surface focus:outline-none focus:border-primary transition-all bg-surface-low/30 cursor-pointer"
            />
          </div>

          {/* Status Dropdown */}
          <div className="w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-on-surface focus:outline-none focus:border-primary transition-all bg-surface-low/30 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* BOOKINGS CONTENT */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-gray-200"></div>
            ))}
          </div>
        ) : paginatedBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 border border-gray-200 text-center space-y-2">
            <p className="font-headline font-bold text-lg text-on-surface">No bookings found</p>
            <p className="text-xs text-gray-400">Try modifying your search query or date filter parameters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 1. MOBILE RESPONSIVE CARDS VIEW (visible on < lg) */}
            <div className="lg:hidden space-y-4">
              {paginatedBookings.map((b) => {
                const bookingIdShort = `#${b._id ? b._id.slice(-6).toUpperCase() : 'TX'}`;
                const slotDate = b.slot?.date || b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
                const slotTime = b.slot ? `${b.slot.startTime} - ${b.slot.endTime}` : '07:00 - 08:00';
                const groundName = b.ground?.name || 'Green Box Cricket';
                const status = b.paymentStatus || 'pending';

                return (
                  <div
                    key={b._id}
                    className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-xs space-y-4"
                  >
                    {/* Top Row: Ground, ID, Status Badge */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-primary">
                          {bookingIdShort}
                        </span>
                        <h3 className="font-headline font-bold text-base text-on-surface">
                          {groundName}
                        </h3>
                      </div>

                      <Badge variant={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="font-semibold text-on-surface text-sm">{b.customerName || 'Player'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <a href={`tel:${b.customerPhone}`} className="text-primary font-medium hover:underline">
                          {b.customerPhone || 'N/A'}
                        </a>
                      </div>
                    </div>

                    {/* Schedule & Price Row */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50/80 rounded-xl text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Match Time</span>
                        <p className="font-semibold text-on-surface mt-0.5">{slotTime}</p>
                        <p className="text-[11px] text-gray-500">{formatTableDate(slotDate)}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Amount</span>
                        <p className="font-headline font-bold text-base text-primary mt-0.5">
                          ₹{b.amount ? b.amount.toLocaleString() : '600'}
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    {status !== 'refunded' && status !== 'cancelled' && (
                      <div className="pt-1">
                        <button
                          type="button"
                          disabled={cancellingId === b._id}
                          onClick={() => handleCancelBooking(b._id)}
                          className="w-full py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-error border border-red-200 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                        >
                          {cancellingId === b._id ? 'Cancelling...' : 'Cancel Booking & Release Slot'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 2. DESKTOP SPACIOUS TABLE VIEW (visible on >= lg) */}
            <div className="hidden lg:block bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200/80 bg-gray-50/60 text-[11px] font-sans font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="py-4 px-6">ID</th>
                      <th className="py-4 px-6">Customer</th>
                      <th className="py-4 px-6">Date & Time</th>
                      <th className="py-4 px-6">Slot / Turf</th>
                      <th className="py-4 px-6">Amount</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {paginatedBookings.map((b) => {
                      const bookingIdShort = `#${b._id ? b._id.slice(-6).toUpperCase() : 'TX'}`;
                      const slotDate = b.slot?.date || b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
                      const slotTime = b.slot ? `${b.slot.startTime} - ${b.slot.endTime}` : '07:00 - 08:00';
                      const groundName = b.ground?.name || 'Green Box Cricket';
                      const status = b.paymentStatus || 'pending';

                      return (
                        <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-6 font-mono text-xs text-primary font-bold">
                            {bookingIdShort}
                          </td>

                          <td className="py-4 px-6">
                            <p className="font-headline font-semibold text-on-surface">
                              {b.customerName || 'Customer'}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {b.customerPhone || '+91 98765 43210'}
                            </p>
                          </td>

                          <td className="py-4 px-6">
                            <p className="text-on-surface font-semibold text-xs">
                              {formatTableDate(slotDate)}
                            </p>
                            <p className="text-xs font-medium text-primary mt-0.5">
                              {slotTime}
                            </p>
                          </td>

                          <td className="py-4 px-6 text-on-surface font-medium text-xs">
                            {groundName}
                          </td>

                          <td className="py-4 px-6 font-headline font-bold text-on-surface">
                            ₹{b.amount ? b.amount.toLocaleString() : '600'}
                          </td>

                          <td className="py-4 px-6">
                            <Badge variant={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Badge>
                          </td>

                          <td className="py-4 px-6 text-right">
                            {status !== 'refunded' && status !== 'cancelled' ? (
                              <button
                                type="button"
                                disabled={cancellingId === b._id}
                                onClick={() => handleCancelBooking(b._id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-error border border-red-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                              >
                                <span>{cancellingId === b._id ? 'Cancelling...' : 'Cancel'}</span>
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium italic">
                                Cancelled
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

            {/* PAGINATION */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
              <div>
                Showing <span className="font-semibold text-on-surface">{paginatedBookings.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
                <span className="font-semibold text-on-surface">
                  {Math.min(currentPage * itemsPerPage, filteredBookings.length)}
                </span>{' '}
                of <span className="font-semibold text-on-surface">{filteredBookings.length}</span> results
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-on-surface transition-colors cursor-pointer"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
                      currentPage === page
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-white hover:bg-gray-50 border border-gray-200 text-on-surface'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-on-surface transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
}
