import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Banknote,
  Percent,
  ChevronRight,
  Trophy,
  ArrowUpRight,
  AlertCircle,
  RotateCcw,
  TrendingUp,
  Activity,
  CheckCircle2,
  CalendarDays,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function formatTableDate(dateStr) {
  if (!dateStr) return 'Today';
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
    month: 'short',
    day: 'numeric',
  });
}

function formatSlotTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 && h < 24 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      console.error('AdminDashboard fetch error:', err);
      setError(err.message || 'Error loading dashboard bookings data');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Compute Real Insights from Bookings
  const analytics = useMemo(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    const todayDDMMYYYY = `${day}-${month}-${year}`;
    const todayYYYYMMDD = `${year}-${month}-${day}`;

    // 1. Today's Bookings
    const todayActive = bookings.filter((b) => {
      if (b.status === 'cancelled') return false;
      const bDate = b.slot?.date || b.date;
      if (bDate === todayDDMMYYYY || bDate === todayYYYYMMDD) return true;
      if (b.createdAt && b.createdAt.startsWith(todayYYYYMMDD)) return true;
      return false;
    });

    const todaysCount = todayActive.length;
    const todaysRevenue = todayActive.reduce((sum, b) => sum + (b.amount || 0), 0);
    const occupancyRate = Math.min(Math.round((todaysCount / 17) * 100), 100);

    // 2. Lifetime Totals
    const confirmedBookings = bookings.filter((b) => b.status !== 'cancelled');
    const totalLifetimeRevenue = confirmedBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    // 3. Real Weekly Revenue (Monday through Sunday of current week)
    const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
    // Calculate Monday's date
    const distanceToMonday = (currentDayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekData = weekDays.map((dayLabel, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);

      const dDay = String(d.getDate()).padStart(2, '0');
      const dMonth = String(d.getMonth() + 1).padStart(2, '0');
      const dYear = d.getFullYear();
      const targetDDMM = `${dDay}-${dMonth}-${dYear}`;
      const targetYYYYMM = `${dYear}-${dMonth}-${dDay}`;

      const dayMatches = bookings.filter((b) => {
        if (b.status === 'cancelled') return false;
        const bDate = b.slot?.date || b.date;
        return (
          bDate === targetDDMM ||
          bDate === targetYYYYMM ||
          (b.createdAt && b.createdAt.startsWith(targetYYYYMM))
        );
      });

      const dayRevenue = dayMatches.reduce((sum, b) => sum + (b.amount || 0), 0);

      return {
        label: dayLabel,
        dateStr: `${dDay}/${dMonth}`,
        revenue: dayRevenue,
        matchesCount: dayMatches.length,
        isToday: targetDDMM === todayDDMMYYYY,
      };
    });

    const thisWeekTotalRevenue = weekData.reduce((sum, w) => sum + w.revenue, 0);
    const maxWeeklyRev = Math.max(...weekData.map((w) => w.revenue), 1800);

    // Compute SVG polyline points (width: 560, height: 140)
    // padding: left 20, right 540
    const points = weekData.map((w, idx) => {
      const x = 20 + idx * (520 / 6);
      // y scaled between 20 (top) and 130 (bottom)
      const ratio = w.revenue / (maxWeeklyRev * 1.2 || 2000);
      const y = 130 - Math.min(ratio * 110, 110);
      return { x, y, ...w };
    });

    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z`;

    return {
      todaysCount,
      todaysRevenue,
      occupancyRate,
      totalLifetimeRevenue,
      thisWeekTotalRevenue,
      maxWeeklyRev,
      weekData: points,
      pathD,
      areaD,
      recentBookings: bookings.slice(0, 5),
    };
  }, [bookings]);

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 max-w-7xl">
        
        {/* DASHBOARD HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline font-bold text-2xl sm:text-3xl text-on-surface tracking-tight">
                Dashboard Overview
              </h1>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                Green Box Cricket
              </span>
            </div>
            <p className="text-sm text-on-surface-variant font-sans mt-1">
              Live booking analytics, daily revenue metrics, and scheduled matches.
            </p>
          </div>

          {/* Date Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200/80 shadow-surface-1 text-xs sm:text-sm font-semibold text-on-surface self-start sm:self-auto">
            <Calendar className="w-4 h-4 text-primary" />
            <span>Today, {todayFormatted}</span>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-error text-sm font-semibold flex items-center justify-between gap-4">
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

        {/* TOP 3 METRIC CARDS */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 h-36"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Metric 1: Today's Bookings */}
            <div className="bg-white rounded-2xl p-6 border-2 border-primary/20 hover:border-primary shadow-surface-1 transition-all space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Today's Bookings
                </span>
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
              
              <div className="flex items-baseline justify-between pt-1">
                <span className="font-headline font-bold text-3xl sm:text-4xl text-on-surface">
                  {analytics.todaysCount}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-sans font-semibold text-xs">
                  <Activity className="w-3.5 h-3.5" />
                  Live Sync
                </span>
              </div>
            </div>

            {/* Metric 2: Today's Revenue */}
            <div className="bg-white rounded-2xl p-6 border-2 border-secondary/20 hover:border-secondary shadow-surface-1 transition-all space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Today's Revenue
                </span>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-secondary flex items-center justify-center">
                  <Banknote className="w-5 h-5" />
                </div>
              </div>
              
              <div className="flex items-baseline justify-between pt-1">
                <span className="font-headline font-bold text-3xl sm:text-4xl text-on-surface">
                  ₹{analytics.todaysRevenue.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#6cf8bb]/30 text-secondary font-sans font-semibold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
            </div>

            {/* Metric 3: Occupancy Rate */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 hover:border-gray-300 shadow-surface-1 transition-all space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Today's Occupancy
                </span>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              
              <div className="flex items-baseline justify-between pt-1">
                <span className="font-headline font-bold text-3xl sm:text-4xl text-on-surface">
                  {analytics.occupancyRate}%
                </span>
                <span className="text-xs text-on-surface-variant font-medium">
                  {analytics.occupancyRate > 0 ? `${analytics.todaysCount} of 17 slots` : 'No bookings yet'}
                </span>
              </div>
            </div>

          </div>
        )}

        {/* BOTTOM SECTION: 2 COLUMNS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Real Weekly Revenue Chart (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-surface-1 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline font-semibold text-lg text-on-surface">
                  Weekly Revenue Insights
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Calculated in real-time from verified MongoDB reservations
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-gray-500">Week Total: </span>
                <span className="font-headline font-bold text-sm text-primary">
                  ₹{analytics.thisWeekTotalRevenue.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Dynamic Scaled SVG Chart */}
            <div className="relative w-full pt-4 overflow-x-auto">
              <div className="min-w-[420px] sm:min-w-0">
                {/* Grid Lines & Labels */}
                <div className="relative h-64 w-full">
                  <div className="absolute inset-0 flex flex-col justify-between text-[11px] text-gray-400 font-sans pointer-events-none pb-8">
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-right">₹{Math.round(analytics.maxWeeklyRev * 1.2)}</span>
                      <div className="flex-1 border-b border-gray-100"></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-right">₹{Math.round((analytics.maxWeeklyRev * 1.2) * 0.66)}</span>
                      <div className="flex-1 border-b border-gray-100"></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-right">₹{Math.round((analytics.maxWeeklyRev * 1.2) * 0.33)}</span>
                      <div className="flex-1 border-b border-gray-100"></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-right">₹0</span>
                      <div className="flex-1 border-b border-gray-100"></div>
                    </div>
                  </div>

                  {/* Real SVG Curves and Data Points */}
                  <svg className="w-full h-48 overflow-visible pl-12 pr-4 pt-2" viewBox="0 0 560 140">
                    <defs>
                      <linearGradient id="realRevenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3525cd" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#3525cd" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Area Fill */}
                    {analytics.areaD && (
                      <path
                        d={analytics.areaD}
                        fill="url(#realRevenueGradient)"
                      />
                    )}

                    {/* Main Curve Line */}
                    {analytics.pathD && (
                      <path
                        d={analytics.pathD}
                        fill="none"
                        stroke="#3525cd"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Plot Data Points for each day */}
                    {analytics.weekData.map((pt, i) => (
                      <g key={i}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={pt.isToday ? '6' : '4.5'}
                          className={`transition-all duration-300 ${
                            pt.isToday
                              ? 'fill-primary stroke-white stroke-[2.5px] drop-shadow-md'
                              : 'fill-white stroke-primary stroke-[2.5px]'
                          }`}
                        />
                        {pt.revenue > 0 && (
                          <text
                            x={pt.x}
                            y={pt.y - 10}
                            textAnchor="middle"
                            className="text-[10px] font-bold fill-primary"
                          >
                            ₹{pt.revenue}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>

                  {/* Day Labels along bottom */}
                  <div className="flex justify-between pl-12 pr-4 pt-2 text-xs font-semibold text-gray-500">
                    {analytics.weekData.map((day, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <span className={day.isToday ? 'text-primary font-bold' : ''}>
                          {day.label}
                        </span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          {day.dateStr}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Bookings (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-gray-200/80 shadow-surface-1 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h2 className="font-headline font-semibold text-lg text-on-surface">
                Recent Bookings
              </h2>
              <Link
                to="/admin/bookings"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 rounded-xl"></div>
                ))}
              </div>
            ) : analytics.recentBookings.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400">
                No recent customer bookings recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.recentBookings.map((b) => {
                  const timeSlot = b.slot
                    ? `${formatSlotTime(b.slot.startTime)}`
                    : '18:00';
                  const dateDisplay = formatTableDate(b.slot?.date || b.date || b.createdAt);
                  const isCancelled = b.status === 'cancelled';

                  return (
                    <div
                      key={b._id}
                      className="p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-headline font-bold text-xs shrink-0 ${
                          isCancelled ? 'bg-red-50 text-error' : 'bg-primary/10 text-primary'
                        }`}>
                          {timeSlot.slice(0, 5)}
                        </div>
                        <div>
                          <p className="font-semibold text-xs sm:text-sm text-on-surface line-clamp-1">
                            {b.customerName || 'Player'}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {dateDisplay} • ₹{b.amount || 600}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isCancelled
                            ? 'bg-red-50 text-error'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {b.status === 'confirmed' ? 'Paid' : b.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
