import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Star,
  Clock,
  Banknote,
  Sparkles,
  Calendar,
  ShieldCheck,
  Trophy,
  ArrowRight,
  CreditCard,
  QrCode,
  Zap,
  Check,
  Lock,
  ChevronRight,
  Compass,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import Button from '../components/common/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function format12(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 && h < 24 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

export default function Home() {
  const { setSelectedGround } = useBooking();

  const [ground, setGround] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interactive 3-Steps State
  const [activeStep, setActiveStep] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [previewSelectedSlot, setPreviewSelectedSlot] = useState('7:00 PM');
  const [previewPaymentMethod, setPreviewPaymentMethod] = useState('upi');

  // Fetch single ground from backend API on mount
  const fetchGround = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/grounds`);
      if (!res.ok) {
        throw new Error(`Failed to load ground details (Status: ${res.status})`);
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const firstGround = data[0];
        setGround(firstGround);
        setSelectedGround(firstGround);
      } else {
        throw new Error('No grounds found in database');
      }
    } catch (err) {
      console.error('Home: error fetching ground:', err);
      setError(err.message || 'Could not connect to backend server');
    } finally {
      setLoading(false);
    }
  }, [setSelectedGround]);

  useEffect(() => {
    fetchGround();
  }, [fetchGround]);

  // Auto-advance step every 4.5 seconds unless hovered/paused
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev % 3) + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const locationBadge = ground?.location || 'Gachibowli, Hyderabad';
  const openHours = ground
    ? `${format12(ground.openTime)} - ${format12(ground.closeTime)}`
    : '6:00 AM - 11:00 PM';
  const startingPrice = ground ? `₹${ground.pricePerSlot}/hr` : '₹600/hr';

  const stepsData = [
    {
      id: 1,
      title: 'Pick Date & Slot',
      desc: "Browse real-time availability and select a time that fits your squad's schedule.",
      icon: Calendar,
      tag: 'Real-time Slots',
    },
    {
      id: 2,
      title: 'Secure Payment',
      desc: 'Pay split amounts or full upfront using UPI, Cards, or Netbanking instantly.',
      icon: ShieldCheck,
      tag: 'Instant Checkout',
    },
    {
      id: 3,
      title: 'Arrive & Play',
      desc: 'Show your digital match pass at the desk, grab your gear, and hit the floodlit turf.',
      icon: Trophy,
      tag: 'Ready to Play',
    },
  ];

  // LOADING SKELETON
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-16 animate-pulse">
          {/* Hero Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="w-36 h-7 bg-gray-200 rounded-full"></div>
              <div className="space-y-3">
                <div className="w-3/4 h-12 bg-gray-200 rounded-xl"></div>
                <div className="w-1/2 h-12 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="w-5/6 h-5 bg-gray-200 rounded"></div>
              <div className="flex gap-4 pt-2">
                <div className="w-36 h-12 bg-gray-200 rounded-xl"></div>
                <div className="w-28 h-12 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
            <div className="lg:col-span-6">
              <div className="aspect-[4/3] w-full rounded-2xl bg-gray-200"></div>
            </div>
          </div>

          {/* Specs Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-gray-200 p-6"></div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-red-200 shadow-surface-2 text-center space-y-5 animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-error flex items-center justify-center mx-auto border border-red-100">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-xl text-on-surface">
              Unable to Load Ground Details
            </h2>
            <p className="text-sm text-on-surface-variant mt-2 font-sans">
              {error}
            </p>
          </div>
          <Button
            onClick={fetchGround}
            className="w-full py-3 bg-primary hover:bg-[#2d1eb3] text-white flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Connection</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-16 sm:space-y-24">
        
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-6 space-y-6">
            {/* Location Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-secondary text-xs font-semibold tracking-wide border border-emerald-200/60">
              <MapPin className="w-3.5 h-3.5 text-secondary" />
              <span>{locationBadge}</span>
            </div>

            {/* Headline */}
            <h1 className="font-headline font-bold text-4xl sm:text-5xl lg:text-[52px] text-on-surface leading-[1.15] tracking-tight">
              Your <span className="text-primary">Premier</span>
              <br />
              Cricket Box.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-on-surface-variant font-sans max-w-xl leading-relaxed">
              Experience high-energy night matches on professional-grade artificial turf. Floodlit, accessible, and ready for your team.
            </p>

            {/* Action Row */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <Link to="/book">
                <Button size="lg" className="px-8 py-3.5 text-base font-semibold shadow-surface-1 hover:shadow-surface-2 bg-primary hover:bg-[#2d1eb3]">
                  Book Now
                </Button>
              </Link>

              {/* Rating */}
              <div className="flex items-center gap-2 text-sm font-medium text-on-surface">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-on-surface">4.8/5</span>
                <span className="text-on-surface-variant text-xs sm:text-sm font-normal">(200+ reviews)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Turf Graphic */}
          <div className="lg:col-span-6">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-surface-2 border border-gray-200/80 bg-gray-950 group">
              {/* Indoor Box Cricket Turf Hero Image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-[#032815]">
                <img
                  src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80"
                  alt="TurfX Box Cricket Pitch"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Overlaid Floodlight Gradient Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

                {/* Pitch Highlights */}
                <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
              </div>
            </div>
          </div>
        </section>

        {/* SPECS / FEATURE CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Opening Hours */}
          <div className="group bg-white rounded-xl p-6 border border-gray-200/80 shadow-surface-1 hover:border-[#c7c4d8] hover:shadow-surface-2 transition-all duration-200 flex items-start gap-4 cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-[#f3f4f5] group-hover:bg-primary-container flex items-center justify-center flex-shrink-0 text-primary group-hover:text-white transition-all duration-200">
              <Clock className="w-5 h-5 transition-colors" />
            </div>
            <div>
              <h3 className="font-headline font-semibold text-lg text-on-surface">
                Opening Hours
              </h3>
              <p className="text-sm font-normal text-on-surface mt-1">
                {openHours}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Open 7 Days a week
              </p>
            </div>
          </div>

          {/* Card 2: Pricing */}
          <div className="group bg-white rounded-xl p-6 border border-gray-200/80 shadow-surface-1 hover:border-[#c7c4d8] hover:shadow-surface-2 transition-all duration-200 flex items-start gap-4 cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-[#f3f4f5] group-hover:bg-primary-container flex items-center justify-center flex-shrink-0 text-primary group-hover:text-white transition-all duration-200">
              <Banknote className="w-5 h-5 transition-colors" />
            </div>
            <div>
              <h3 className="font-headline font-semibold text-lg text-on-surface">
                Pricing
              </h3>
              <p className="text-sm font-normal text-on-surface mt-1">
                Starts at <span className="font-semibold text-secondary">{startingPrice}</span>
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Peak hour rates apply
              </p>
            </div>
          </div>

          {/* Card 3: Amenities */}
          <div className="group bg-white rounded-xl p-6 border border-gray-200/80 shadow-surface-1 hover:border-[#c7c4d8] hover:shadow-surface-2 transition-all duration-200 flex items-start gap-4 cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-[#f3f4f5] group-hover:bg-primary-container flex items-center justify-center flex-shrink-0 text-primary group-hover:text-white transition-all duration-200">
              <Sparkles className="w-5 h-5 transition-colors" />
            </div>
            <div>
              <h3 className="font-headline font-semibold text-lg text-on-surface">
                Amenities
              </h3>
              <p className="text-sm font-normal text-on-surface mt-1">
                Floodlights, Parking,
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Pro Equipment available
              </p>
            </div>
          </div>
        </section>

        {/* BOOK IN 3 SIMPLE STEPS - ANIMATED & INTERACTIVE */}
        <section
          id="how-it-works"
          className="pt-4 space-y-8"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-headline font-semibold uppercase tracking-wider text-primary">
                Seamless Experience
              </span>
              <h2 className="font-headline font-bold text-3xl sm:text-4xl text-on-surface mt-1">
                Book in <span className="text-primary">3 Simple Steps</span>
              </h2>
            </div>

            {/* Step Indicators Bar */}
            <div className="flex items-center gap-2">
              {stepsData.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(s.id)}
                  aria-label={`Jump to step ${s.id}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeStep === s.id
                      ? 'w-8 bg-primary shadow-sm'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT COLUMN: INTERACTIVE TIMELINE STEPS (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              {stepsData.map((s, index) => {
                const isActive = activeStep === s.id;
                const isPassed = activeStep > s.id;

                return (
                  <div
                    key={s.id}
                    onClick={() => setActiveStep(s.id)}
                    onMouseEnter={() => setActiveStep(s.id)}
                    className={`group cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative ${
                      isActive
                        ? 'bg-white border-primary/40 shadow-surface-2 ring-1 ring-primary/10 translate-x-1'
                        : 'bg-white/60 hover:bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-surface-1'
                    }`}
                  >
                    {/* Connecting Line between steps */}
                    {index < stepsData.length - 1 && (
                      <div
                        className={`absolute left-[38px] top-[58px] bottom-[-20px] w-[2px] z-0 transition-colors duration-300 ${
                          isPassed || (isActive && activeStep === 1)
                            ? 'bg-gradient-to-b from-primary to-indigo-200'
                            : 'bg-gray-200'
                        }`}
                      />
                    )}

                    <div className="flex items-start gap-4 relative z-10">
                      {/* Step Number Circle */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold text-sm flex-shrink-0 transition-all duration-300 ${
                          isActive
                            ? 'bg-primary text-white shadow-[0_0_15px_rgba(79,70,229,0.35)] scale-105'
                            : isPassed
                            ? 'bg-emerald-50 text-secondary border border-emerald-300'
                            : 'bg-surface-low border border-gray-200 text-gray-500 group-hover:border-primary/40 group-hover:text-primary'
                        }`}
                      >
                        {isPassed ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <span>{s.id}</span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3
                            className={`font-headline font-semibold text-base sm:text-lg transition-colors ${
                              isActive ? 'text-primary' : 'text-on-surface'
                            }`}
                          >
                            {s.title}
                          </h3>

                          {/* Mini Tag */}
                          <span
                            className={`text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full transition-all ${
                              isActive
                                ? 'bg-primary/10 text-primary'
                                : 'bg-gray-100 text-gray-500 opacity-70 group-hover:opacity-100'
                            }`}
                          >
                            {s.tag}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                          {s.desc}
                        </p>

                        {/* Interactive prompt on active */}
                        {isActive && (
                          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary animate-in fade-in duration-200">
                            <span>See live preview on the right</span>
                            <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT COLUMN: DYNAMIC ANIMATED PREVIEW CARD (6 cols) */}
            <div className="lg:col-span-6">
              <div className="relative min-h-[380px] sm:min-h-[400px] w-full rounded-3xl bg-gradient-to-br from-gray-900 via-gray-950 to-[#071b12] border border-gray-800 shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden group">
                
                {/* Background Ambient Glows */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/20 rounded-full blur-3xl pointer-events-none transition-all duration-700"></div>
                <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none transition-all duration-700"></div>
                
                {/* Grid texture overlay */}
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
                    backgroundSize: '20px 20px',
                  }}
                />

                {/* CARD HEADER */}
                <div className="relative z-10 flex items-center justify-between border-b border-gray-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary-light flex items-center justify-center border border-primary/30">
                      {activeStep === 1 ? (
                        <Calendar className="w-4 h-4 text-emerald-400" />
                      ) : activeStep === 2 ? (
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Trophy className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-sans font-bold tracking-wider text-gray-400">
                        Interactive Step {activeStep} Preview
                      </span>
                      <p className="text-sm font-headline font-semibold text-white">
                        {activeStep === 1
                          ? 'Real-Time Slot Picker'
                          : activeStep === 2
                          ? 'Instant Secure Checkout'
                          : 'Digital Match Pass & Venue'}
                      </p>
                    </div>
                  </div>

                  {/* Live Status Pill */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Preview
                  </span>
                </div>

                {/* CARD DYNAMIC BODY */}
                <div className="relative z-10 my-auto py-5">
                  
                  {/* PREVIEW STEP 1: PICK DATE & SLOT */}
                  {activeStep === 1 && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                      {/* Mini Date Row */}
                      <div className="flex items-center gap-2">
                        {['Today', 'Tomorrow', 'This Weekend'].map((d, i) => (
                          <div
                            key={d}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                              i === 0
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-gray-800/80 text-gray-400 hover:text-white border border-gray-700'
                            }`}
                          >
                            {d}
                          </div>
                        ))}
                      </div>

                      {/* Interactive Mini Slot Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                        {[
                          { time: '06:00 PM', status: 'available', price: `₹${ground?.pricePerSlot || 600}` },
                          { time: '07:00 PM', status: 'selected', price: `₹${ground?.pricePerSlot || 600}` },
                          { time: '08:00 PM', status: 'booked', price: `₹${ground?.peakPrice || 900}` },
                          { time: '09:00 PM', status: 'available', price: `₹${ground?.peakPrice || 900}` },
                        ].map((s) => {
                          const isSelected = previewSelectedSlot === s.time;
                          const isBooked = s.status === 'booked';

                          return (
                            <button
                              key={s.time}
                              type="button"
                              disabled={isBooked}
                              onClick={() => setPreviewSelectedSlot(s.time)}
                              className={`p-2.5 rounded-xl text-center border transition-all duration-200 relative group/slot ${
                                isBooked
                                  ? 'bg-gray-900/60 border-gray-800 text-gray-500 opacity-60 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-primary text-white border-primary shadow-lg ring-2 ring-primary/40 scale-105'
                                  : 'bg-gray-800/90 hover:bg-gray-700/80 border-emerald-500/40 text-gray-200'
                              }`}
                            >
                              {isSelected && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-primary flex items-center justify-center text-[10px] font-bold shadow">
                                  ✓
                                </span>
                              )}
                              <p className="font-headline font-bold text-xs">
                                {s.time}
                              </p>
                              <span
                                className={`text-[10px] font-semibold mt-0.5 block ${
                                  isSelected
                                    ? 'text-white/90'
                                    : isBooked
                                    ? 'text-gray-500'
                                    : 'text-emerald-400'
                                }`}
                              >
                                {isBooked ? 'Booked' : s.price}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected Summary Pill */}
                      <div className="bg-gray-900/90 rounded-xl p-3 border border-gray-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-gray-300">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span>Selected: <strong>{previewSelectedSlot} (1 hr)</strong></span>
                        </div>
                        <span className="font-headline font-bold text-emerald-400 text-sm">
                          ₹{ground?.pricePerSlot || 600}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* PREVIEW STEP 2: SECURE PAYMENT */}
                  {activeStep === 2 && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                      {/* Payment Options Row */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'upi', label: 'UPI / QR', icon: QrCode },
                          { id: 'card', label: 'Card', icon: CreditCard },
                          { id: 'net', label: 'Netbanking', icon: Lock },
                        ].map((m) => {
                          const Icon = m.icon;
                          const isPicked = previewPaymentMethod === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setPreviewPaymentMethod(m.id)}
                              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs transition-all ${
                                isPicked
                                  ? 'bg-primary/20 border-primary text-white ring-1 ring-primary/40'
                                  : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-gray-200'
                              }`}
                            >
                              <Icon className="w-4 h-4 text-emerald-400" />
                              <span className="font-semibold text-[11px]">{m.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Mock Credit / UPI Preview Box */}
                      <div className="bg-gradient-to-r from-gray-900 to-indigo-950/80 rounded-2xl p-4 border border-indigo-500/30 space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Razorpay Secure Gateway</span>
                          <span className="text-emerald-400 font-mono font-bold">256-Bit SSL</span>
                        </div>
                        <div className="flex items-center justify-between text-white font-headline pt-1">
                          <div>
                            <p className="text-[10px] uppercase text-gray-400">Player</p>
                            <p className="text-xs font-semibold">Rahul Sharma</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase text-gray-400">Total</p>
                            <p className="text-base font-bold text-emerald-400">
                              ₹{Math.round((ground?.pricePerSlot || 600) * 1.18)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Pay Button Shimmer Preview */}
                      <div className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-headline font-semibold text-xs text-center shadow-lg flex items-center justify-center gap-2">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Pay ₹{Math.round((ground?.pricePerSlot || 600) * 1.18)} Instantly</span>
                      </div>
                    </div>
                  )}

                  {/* PREVIEW STEP 3: ARRIVE & PLAY */}
                  {activeStep === 3 && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                      {/* Match Pass Ticket Box */}
                      <div className="bg-gradient-to-br from-emerald-950/40 via-gray-900 to-indigo-950/40 rounded-2xl p-4 border border-emerald-500/30 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/20">
                              PASS #TX-9842
                            </span>
                            <h4 className="font-headline font-bold text-sm text-white mt-1.5">
                              {ground?.name || 'Green Box Cricket'}
                            </h4>
                            <p className="text-xs text-gray-400">Turf A • 5v5 Match</p>
                          </div>

                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center">
                            <QrCode className="w-6 h-6" />
                          </div>
                        </div>

                        {/* Feature Badges */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md">
                            ⚡ Floodlights ON
                          </span>
                          <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md">
                            🏏 Pro Bats & Balls Ready
                          </span>
                          <span className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md">
                            🅿️ Free Parking
                          </span>
                        </div>
                      </div>

                      {/* Directions Preview */}
                      <div className="flex items-center justify-between bg-gray-900/90 rounded-xl p-3 border border-gray-800 text-xs">
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <span className="truncate max-w-[200px]">{ground?.location}</span>
                        </div>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          Get Map <Compass className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  )}

                </div>

                {/* CARD FOOTER WITH BOOK NOW CTA */}
                <div className="relative z-10 pt-4 border-t border-gray-800/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Ready to book in under 60 seconds</span>
                  </div>

                  <Link
                    to="/book"
                    className="inline-flex items-center gap-1.5 text-xs font-headline font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group-hover:translate-x-0.5"
                  >
                    <span>Try Booking</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
