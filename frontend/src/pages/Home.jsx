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
} from 'lucide-react';
import { useBooking, DEFAULT_GROUND } from '../context/BookingContext';
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
  const { selectedGround, setSelectedGround } = useBooking();

  // Instant default state so page never gets stuck on skeleton
  const [ground, setGround] = useState(() => selectedGround || DEFAULT_GROUND);

  // Interactive 3-Steps State
  const [activeStep, setActiveStep] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [previewSelectedSlot, setPreviewSelectedSlot] = useState('07:00 PM');
  const [previewPaymentMethod, setPreviewPaymentMethod] = useState('upi');

  // Background fetch to sync ground details if server is available
  const fetchGround = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/grounds`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const firstGround = data[0];
          setGround(firstGround);
          setSelectedGround(firstGround);
        }
      }
    } catch (err) {
      // Graceful fallback to default ground — zero blocking
      console.warn('Using default ground specs:', err.message);
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12 space-y-16 sm:space-y-24">
        
        {/* HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-6 space-y-6 animate-fade-up">
            {/* Location Pill */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-secondary text-xs font-semibold tracking-wide border border-emerald-200/60 shadow-xs hover:scale-105 transition-transform duration-300">
              <MapPin className="w-3.5 h-3.5 text-secondary" />
              <span>{locationBadge}</span>
            </div>

            {/* Headline */}
            <h1 className="font-headline font-bold text-2xl sm:text-4xl lg:text-5xl text-on-surface leading-[1.2] sm:leading-[1.15] tracking-tight">
              Your <span className="text-primary bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Premier</span>
              <br />
              Cricket Box.
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-base lg:text-lg text-on-surface-variant font-sans max-w-xl leading-relaxed">
              Experience high-energy night matches on professional-grade artificial turf. Floodlit, accessible, and ready for your team.
            </p>

            {/* Action Row */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1 sm:pt-2">
              <Link to="/book">
                <Button size="lg" className="px-6 sm:px-8 py-2.5 sm:py-3.5 text-sm sm:text-base font-semibold shadow-surface-1 hover:shadow-surface-2 bg-primary hover:bg-[#2d1eb3] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                  Book Now
                </Button>
              </Link>

              {/* Rating */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-on-surface">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-on-surface">4.8/5</span>
                <span className="text-on-surface-variant text-[11px] sm:text-sm font-normal">(200+ reviews)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Animated SVG Box Cricket Arena Graphic */}
          <div className="lg:col-span-6 animate-fade-up">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-800/80 bg-gradient-to-b from-gray-950 via-[#07130e] to-[#041009] p-4 sm:p-6 group select-none transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_20px_50px_rgba(16,185,129,0.15)]">
              
              {/* Top Floater Badge (Glassmorphic) */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-gray-900/85 backdrop-blur-md border border-emerald-500/30 shadow-lg animate-float-slow">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400">Live Night Session</span>
                  <span className="text-xs font-semibold text-white">Floodlights 100% Active</span>
                </div>
              </div>

              {/* Bottom Floater Badge (Glassmorphic) */}
              <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-gray-900/85 backdrop-blur-md border border-indigo-500/30 shadow-lg animate-float-reverse">
                <div className="w-8 h-8 rounded-xl bg-primary/20 text-indigo-300 flex items-center justify-center border border-primary/40 font-bold text-xs">
                  TX
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-indigo-300">Instant Booking</span>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" /> Slot Confirmed
                  </span>
                </div>
              </div>

              {/* Vector SVG Arena Container */}
              <div className="relative aspect-[4/3] w-full flex items-center justify-center overflow-hidden rounded-2xl">
                
                {/* Background Ambient Glows */}
                <div className="absolute top-0 left-1/4 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
                <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

                {/* SVG BOX CRICKET STADIUM ILLUSTRATION */}
                <svg
                  viewBox="0 0 600 450"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full transform transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                >
                  <defs>
                    {/* Turf Gradient */}
                    <radialGradient id="turfGrassGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#15803d" />
                      <stop offset="45%" stopColor="#166534" />
                      <stop offset="85%" stopColor="#14532d" />
                      <stop offset="100%" stopColor="#052e16" />
                    </radialGradient>

                    {/* Pitch Strip Gradient */}
                    <linearGradient id="pitchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ca8a04" stopOpacity="0.85" />
                      <stop offset="50%" stopColor="#d97706" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#b45309" stopOpacity="0.85" />
                    </linearGradient>

                    {/* Floodlight Beam Left */}
                    <linearGradient id="beamLeftGrad" x1="0%" y1="0%" x2="50%" y2="80%">
                      <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.55" />
                      <stop offset="40%" stopColor="#34d399" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>

                    {/* Floodlight Beam Right */}
                    <linearGradient id="beamRightGrad" x1="100%" y1="0%" x2="50%" y2="80%">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity="0.55" />
                      <stop offset="40%" stopColor="#6366f1" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                    </linearGradient>

                    {/* Ball Glow Filter */}
                    <filter id="neonBallGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    
                    {/* Stadium Boundary Glow */}
                    <filter id="boundaryGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>

                    {/* Turf Mesh Pattern */}
                    <pattern id="turfGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#22c55e" strokeWidth="0.5" strokeOpacity="0.15" />
                    </pattern>
                  </defs>

                  {/* 1. STADIUM BACKGROUND FLOOR */}
                  <rect width="600" height="450" fill="transparent" />

                  {/* 2. OUTER STADIUM ARENA BOUNDARY (ISOMETRIC OVAL) */}
                  <ellipse cx="300" cy="245" rx="275" ry="165" fill="#021c10" stroke="#1e293b" strokeWidth="3" />
                  <ellipse cx="300" cy="245" rx="260" ry="155" fill="url(#turfGrassGrad)" stroke="#10b981" strokeWidth="2" strokeOpacity="0.6" filter="url(#boundaryGlow)" />
                  
                  {/* Turf Grid Overlay */}
                  <ellipse cx="300" cy="245" rx="260" ry="155" fill="url(#turfGrid)" />

                  {/* 3. BOUNDARY SAFETY NETTING CAGE POSTS & RAYS */}
                  <path d="M 40 245 Q 300 420 560 245" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.3" />
                  <path d="M 40 245 Q 300 70 560 245" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.3" />
                  
                  {/* Outer Boundary Ring Line */}
                  <ellipse cx="300" cy="245" rx="230" ry="135" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="8 6" />

                  {/* 30-Yard Inner Circle Marking */}
                  <ellipse cx="300" cy="245" rx="160" ry="90" fill="none" stroke="#a7f3d0" strokeWidth="1.5" strokeOpacity="0.45" />

                  {/* 4. CRICKET PITCH (CENTER RECTANGLE ISOMETRIC STRIP) */}
                  <g transform="rotate(-15 300 245)">
                    {/* Pitch Base */}
                    <rect x="235" y="150" width="130" height="190" rx="6" fill="url(#pitchGrad)" stroke="#fef08a" strokeWidth="1.5" strokeOpacity="0.6" />
                    
                    {/* Pitch Inner Crease Lines */}
                    {/* Bowling Crease 1 */}
                    <line x1="245" y1="175" x2="355" y2="175" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
                    <line x1="245" y1="165" x2="245" y2="185" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
                    <line x1="355" y1="165" x2="355" y2="185" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
                    
                    {/* Bowling Crease 2 (Batting End) */}
                    <line x1="245" y1="315" x2="355" y2="315" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
                    <line x1="245" y1="305" x2="245" y2="325" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
                    <line x1="355" y1="305" x2="355" y2="325" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />

                    {/* Stumps End 1 */}
                    <circle cx="293" cy="165" r="2" fill="#ffffff" />
                    <circle cx="300" cy="165" r="2" fill="#ffffff" />
                    <circle cx="307" cy="165" r="2" fill="#ffffff" />
                    <rect x="290" y="163" width="20" height="2" rx="1" fill="#facc15" />

                    {/* Stumps End 2 (Batting End) */}
                    <circle cx="293" cy="325" r="2" fill="#ffffff" />
                    <circle cx="300" cy="325" r="2" fill="#ffffff" />
                    <circle cx="307" cy="325" r="2" fill="#ffffff" />
                    <rect x="290" y="325" width="20" height="2" rx="1" fill="#facc15" />

                    {/* Batsman Marker Ring */}
                    <circle cx="300" cy="305" r="14" fill="#3b82f6" fillOpacity="0.25" stroke="#60a5fa" strokeWidth="1.5" />
                    <circle cx="300" cy="305" r="4" fill="#60a5fa" />
                    
                    {/* Bowler Marker Ring */}
                    <circle cx="300" cy="185" r="12" fill="#10b981" fillOpacity="0.25" stroke="#34d399" strokeWidth="1.5" />
                    <circle cx="300" cy="185" r="3.5" fill="#34d399" />
                  </g>

                  {/* 5. FLOODLIGHT TOWERS & BEAMS */}
                  {/* Tower 1 (Top Left) */}
                  <g className="animate-beam">
                    <polygon points="50,40 230,190 120,320 30,70" fill="url(#beamLeftGrad)" />
                    <circle cx="50" cy="40" r="10" fill="#34d399" filter="url(#neonBallGlow)" />
                    <circle cx="50" cy="40" r="4" fill="#ffffff" />
                    <line x1="50" y1="40" x2="30" y2="150" stroke="#475569" strokeWidth="2.5" />
                  </g>

                  {/* Tower 2 (Top Right) */}
                  <g className="animate-beam" style={{ animationDelay: '1.5s' }}>
                    <polygon points="550,40 370,190 480,320 570,70" fill="url(#beamRightGrad)" />
                    <circle cx="550" cy="40" r="10" fill="#818cf8" filter="url(#neonBallGlow)" />
                    <circle cx="550" cy="40" r="4" fill="#ffffff" />
                    <line x1="550" y1="40" x2="570" y2="150" stroke="#475569" strokeWidth="2.5" />
                  </g>

                  {/* Tower 3 (Bottom Left) */}
                  <g>
                    <circle cx="70" cy="370" r="7" fill="#10b981" opacity="0.8" />
                    <line x1="70" y1="370" x2="55" y2="420" stroke="#334155" strokeWidth="2" />
                  </g>

                  {/* Tower 4 (Bottom Right) */}
                  <g>
                    <circle cx="530" cy="370" r="7" fill="#6366f1" opacity="0.8" />
                    <line x1="530" y1="370" x2="545" y2="420" stroke="#334155" strokeWidth="2" />
                  </g>

                  {/* 6. ANIMATED SHOT TRAJECTORY (ARC OF THE BALL) */}
                  {/* Parabolic Trajectory Path */}
                  <path
                    d="M 285 320 Q 210 110 470 140"
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="2.5"
                    className="animate-trajectory"
                    filter="url(#neonBallGlow)"
                  />
                  
                  {/* Second Assist Curve */}
                  <path
                    d="M 285 320 Q 380 180 470 140"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    strokeOpacity="0.4"
                  />

                  {/* 7. DYNAMIC GLOWING CRICKET BALL */}
                  <g className="animate-ball-shot">
                    {/* Outer Glow Halo */}
                    <circle cx="0" cy="0" r="8" fill="#facc15" fillOpacity="0.3" filter="url(#neonBallGlow)" />
                    {/* Ball Body */}
                    <circle cx="0" cy="0" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                    {/* Seam */}
                    <path d="M -3 0 Q 0 -3 3 0" stroke="#ffffff" strokeWidth="0.75" fill="none" />
                  </g>

                  {/* 8. FIELDING POSITION RADAR BLIPS */}
                  <circle cx="160" cy="210" r="4" fill="#4ade80" opacity="0.75" />
                  <circle cx="160" cy="210" r="8" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4" className="animate-ping" style={{ animationDuration: '3s' }} />

                  <circle cx="430" cy="260" r="4" fill="#4ade80" opacity="0.75" />
                  <circle cx="430" cy="260" r="8" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4" className="animate-ping" style={{ animationDuration: '2.5s' }} />

                  <circle cx="210" cy="340" r="4" fill="#818cf8" opacity="0.75" />
                  <circle cx="390" cy="140" r="4" fill="#facc15" opacity="0.75" />

                  {/* Center Ground Branding Pill */}
                  <rect x="240" y="235" width="120" height="20" rx="10" fill="#052e16" stroke="#22c55e" strokeWidth="1" strokeOpacity="0.5" />
                  <text x="300" y="249" fill="#86efac" fontSize="9" fontWeight="bold" fontFamily="Montserrat, sans-serif" textAnchor="middle" letterSpacing="0.08em">
                    TURFX ARENA 1
                  </text>
                </svg>

              </div>
            </div>
          </div>
        </section>

        {/* SPECS / FEATURE CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Opening Hours */}
          <div className="group bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:border-[#c7c4d8] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-start gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <Clock className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div>
              <h3 className="font-headline font-semibold text-lg text-on-surface">
                Opening Hours
              </h3>
              <p className="text-sm font-semibold text-on-surface mt-1">
                {openHours}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Open 7 Days a week
              </p>
            </div>
          </div>

          {/* Card 2: Pricing */}
          <div className="group bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:border-[#c7c4d8] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-start gap-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <Banknote className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div>
              <h3 className="font-headline font-semibold text-lg text-on-surface">
                Pricing
              </h3>
              <p className="text-sm font-semibold text-on-surface mt-1">
                Starts at <span className="font-bold text-emerald-700 group-hover:text-emerald-600">{startingPrice}</span>
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Peak hour rates apply
              </p>
            </div>
          </div>

          {/* Card 3: Amenities */}
          <div className="group bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:border-[#c7c4d8] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-start gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              <Sparkles className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div>
              <h3 className="font-headline font-semibold text-lg text-on-surface">
                Amenities
              </h3>
              <p className="text-sm font-semibold text-on-surface mt-1">
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
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div>
              <span className="text-[10px] sm:text-xs font-headline font-semibold uppercase tracking-wider text-primary">
                Seamless Experience
              </span>
              <h2 className="font-headline font-bold text-xl sm:text-2xl lg:text-3xl text-on-surface mt-0.5 sm:mt-1">
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
                      ? 'w-8 bg-primary shadow-xs'
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
                        ? 'bg-white border-primary/40 shadow-md ring-1 ring-primary/10 translate-x-1'
                        : 'bg-white/60 hover:bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-xs'
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
                                ? 'bg-primary text-white shadow-xs'
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
                              className={`p-2.5 rounded-xl text-center border transition-all duration-200 relative group/slot cursor-pointer ${
                                isBooked
                                  ? 'bg-gray-900/60 border-gray-800 text-gray-500 opacity-60 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-primary text-white border-primary shadow-lg ring-2 ring-primary/40 scale-105'
                                  : 'bg-gray-800/90 hover:bg-gray-700/80 border-emerald-500/40 text-gray-200'
                              }`}
                            >
                              {isSelected && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-primary flex items-center justify-center text-[10px] font-bold shadow-xs">
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
                              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 text-xs transition-all cursor-pointer ${
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
                          <span>Razorpay Demo Gateway</span>
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
                              ₹{ground?.pricePerSlot || 600}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Pay Button Shimmer Preview */}
                      <div className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-headline font-semibold text-xs text-center shadow-lg flex items-center justify-center gap-2">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Pay ₹{ground?.pricePerSlot || 600} Instantly</span>
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
