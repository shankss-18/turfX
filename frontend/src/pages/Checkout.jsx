import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  X,
  Lock,
  ShieldCheck,
  Calendar,
  Clock,
  Trophy,
  AlertCircle,
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import Button from '../components/common/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Format Date e.g. "Oct 24, 2026"
function formatDateDisplay(dateStr) {
  if (!dateStr) return 'Today';
  let d;
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[2]?.length === 4) {
      const [dd, mm, yyyy] = parts;
      d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    } else {
      d = new Date(`${dateStr}T00:00:00`);
    }
  } else {
    d = new Date(dateStr);
  }
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format Time 12hr Range
function formatSlotTimeRange(startTime, endTime) {
  if (!startTime) return '06:00 PM – 07:00 PM';
  const format12 = (t) => {
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 && h < 24 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };
  return `${format12(startTime)} – ${format12(endTime || '19:00')}`;
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    selectedGround,
    selectedDate,
    selectedSlots,
    setLastBooking,
  } = useBooking();

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Demo Razorpay Modal State
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeTab, setActiveTab] = useState('upi'); // upi | card | netbanking | wallet
  const [createdBooking, setCreatedBooking] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessAnim, setPaymentSuccessAnim] = useState(false);

  // Ground and slot details
  const ground = location.state?.ground || selectedGround || {
    _id: 'ground_1',
    name: 'Green Box Cricket',
    location: 'Gachibowli, Hyderabad',
  };

  const slotDetails = location.state?.slots || (selectedSlots.length > 0 ? selectedSlots : [
    { _id: location.state?.slotId || 'slot_demo', startTime: '18:00', endTime: '19:00', price: 600 }
  ]);

  const activeDate = location.state?.date || selectedDate;

  // Pricing calculations (NO GST)
  const basePrice = useMemo(() => {
    if (location.state?.totalAmount) return location.state.totalAmount;
    if (slotDetails && slotDetails.length > 0) {
      return slotDetails.reduce((sum, s) => sum + (s.price || 600), 0);
    }
    return 600;
  }, [slotDetails, location.state?.totalAmount]);

  const totalAmount = basePrice;
  const durationHours = slotDetails?.length || 1;

  // Form field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (serverError) setServerError(null);
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    if (!formData.customerName.trim()) {
      errors.customerName = 'Please enter your full name';
    }
    if (!formData.customerPhone.trim()) {
      errors.customerPhone = 'Please enter your phone number';
    } else if (!/^\+?[0-9\s-]{10,14}$/.test(formData.customerPhone.trim())) {
      errors.customerPhone = 'Please enter a valid phone number (10 digits)';
    }
    if (!formData.customerEmail.trim()) {
      errors.customerEmail = 'Please enter your email address';
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      errors.customerEmail = 'Please enter a valid email address';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Launch Demo Razorpay Gateway Modal
  const handleInitiatePayment = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      // 1. Create booking in backend (slot is reserved in MongoDB)
      const res = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: slotDetails[0]._id,
          slotIds: slotDetails.map((s) => s._id),
          groundId: ground._id,
          customerName: formData.customerName.trim(),
          customerPhone: formData.customerPhone.trim(),
          customerEmail: formData.customerEmail.trim(),
          amount: totalAmount,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to initialize match booking');
      }

      const bookingData = await res.json();
      setCreatedBooking(bookingData.booking || bookingData);
      // Open Demo Razorpay Gateway Modal
      setShowDemoModal(true);
    } catch (err) {
      console.error('Checkout error:', err);
      setServerError(err.message || 'Could not initiate booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simulate Demo Payment Completion
  const handleCompleteDemoPayment = async () => {
    if (!createdBooking) return;
    setIsProcessingPayment(true);

    try {
      const demoPaymentId = `pay_demo_${Math.random().toString(36).slice(2, 10)}`;
      const demoOrderId = createdBooking.razorpayOrderId || `order_demo_${Math.random().toString(36).slice(2, 10)}`;

      // Call backend verification
      const verifyRes = await fetch(`${API_URL}/api/bookings/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: demoOrderId,
          razorpay_payment_id: demoPaymentId,
          bookingId: createdBooking._id,
        }),
      });

      const verifyResult = await verifyRes.json();
      const finalBooking = verifyResult.booking || createdBooking;

      setPaymentSuccessAnim(true);

      setTimeout(() => {
        setLastBooking(finalBooking);
        setShowDemoModal(false);
        navigate('/confirmation', {
          state: {
            booking: finalBooking,
            ground,
            slot: slotDetails[0],
            slots: slotDetails,
            totalAmount,
            date: activeDate,
          },
        });
      }, 700);
    } catch (err) {
      console.error('Demo payment error:', err);
      setServerError('Payment verification issue. Continuing to confirmation.');
      setLastBooking(createdBooking);
      setShowDemoModal(false);
      navigate('/confirmation', {
        state: {
          booking: createdBooking,
          ground,
          slot: slotDetails[0],
          slots: slotDetails,
          totalAmount,
          date: activeDate,
        },
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Formatted slot time
  const timeDisplay = useMemo(() => {
    if (!slotDetails || slotDetails.length === 0) return '06:00 PM – 07:00 PM';
    const first = slotDetails[0];
    const last = slotDetails[slotDetails.length - 1];
    return formatSlotTimeRange(first.startTime, last.endTime);
  }, [slotDetails]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      {/* CHECKOUT HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
          <Link to="/" className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight">
            TurfX
          </Link>

          <button
            type="button"
            onClick={() => navigate('/book')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 hover:text-error transition-colors px-3 py-1.5 rounded-xl hover:bg-red-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Cancel Booking</span>
          </button>
        </div>
      </header>

      {/* MAIN CHECKOUT CONTAINER */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-8">
          
          {/* TITLE */}
          <div className="space-y-1">
            <h1 className="font-headline font-bold text-3xl text-on-surface tracking-tight">
              Checkout
            </h1>
            <p className="text-sm text-gray-500 font-sans">
              Enter player details to complete your match booking with simulated Razorpay payment.
            </p>
          </div>

          {/* SERVER ERROR ALERT */}
          {serverError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-error text-sm font-semibold flex items-center gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* TWO-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: PLAYER DETAILS FORM (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h2 className="font-headline font-bold text-xl text-on-surface">
                  Player Details
                </h2>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Sparkles className="w-3 h-3" /> Demo Sandbox
                </span>
              </div>

              <form onSubmit={handleInitiatePayment} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="customerName" className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                    Full Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="e.g. Rahul Sharma"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-on-surface placeholder:text-gray-400 focus:outline-none transition-all ${
                      formErrors.customerName
                        ? 'border-error focus:ring-4 focus:ring-error/10'
                        : 'border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10'
                    }`}
                  />
                  {formErrors.customerName && (
                    <p className="text-xs text-error font-medium">{formErrors.customerName}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label htmlFor="customerPhone" className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                    Phone Number <span className="text-error">*</span>
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder="e.g. 9876543210"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-on-surface placeholder:text-gray-400 focus:outline-none transition-all ${
                      formErrors.customerPhone
                        ? 'border-error focus:ring-4 focus:ring-error/10'
                        : 'border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10'
                    }`}
                  />
                  {formErrors.customerPhone && (
                    <p className="text-xs text-error font-medium">{formErrors.customerPhone}</p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label htmlFor="customerEmail" className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                    Email Address <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    id="customerEmail"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="e.g. rahul@example.com"
                    className={`w-full px-4 py-3 rounded-xl border text-sm text-on-surface placeholder:text-gray-400 focus:outline-none transition-all ${
                      formErrors.customerEmail
                        ? 'border-error focus:ring-4 focus:ring-error/10'
                        : 'border-gray-300 focus:border-primary focus:ring-4 focus:ring-primary/10'
                    }`}
                  />
                  {formErrors.customerEmail && (
                    <p className="text-xs text-error font-medium">{formErrors.customerEmail}</p>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-3">
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    className="w-full py-4 text-base font-semibold bg-primary hover:bg-[#2d1eb3] shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer rounded-2xl"
                  >
                    <Lock className="w-4 h-4" />
                    <span>PAY ₹{totalAmount} WITH RAZORPAY</span>
                  </Button>
                </div>
              </form>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
              <h2 className="font-headline font-bold text-xl text-on-surface border-b border-gray-100 pb-4">
                Order Summary
              </h2>

              {/* Venue Card Details */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-on-surface">
                    {ground?.name || 'Green Box Cricket'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">
                    {durationHours > 1 ? `${durationHours} Hours Continuous Match` : '1 Hour Match'} • Floodlights Included
                  </p>
                </div>
              </div>

              {/* Date & Time Info Box */}
              <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-100 text-sm">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Date
                  </span>
                  <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate">{formatDateDisplay(activeDate)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Time Slot
                  </span>
                  <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate">{timeDisplay}</span>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-500">
                  <span>Slot Price ({durationHours} {durationHours > 1 ? 'hrs' : 'hr'})</span>
                  <span className="font-semibold text-on-surface">₹{basePrice}</span>
                </div>

                <div className="border-t border-gray-200 pt-3 flex items-baseline justify-between">
                  <span className="font-headline font-bold text-lg text-on-surface">
                    Total
                  </span>
                  <span className="font-headline font-bold text-2xl text-primary">
                    ₹{totalAmount}
                  </span>
                </div>
              </div>

              {/* Security and Trust Badges */}
              <div className="pt-2 flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Razorpay Demo 256-Bit SSL Encrypted</span>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* RAZORPAY DEMO PAYMENT MODAL */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-gray-100 animate-slot-pop">
            
            {/* Razorpay Demo Header */}
            <div className="bg-[#0c2340] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center font-bold text-white shadow-sm">
                  ₹
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-headline font-bold text-base tracking-tight">
                      Razorpay Gateway
                    </p>
                    <span className="text-[10px] uppercase font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full">
                      Demo Mode
                    </span>
                  </div>
                  <p className="text-xs text-white/70">
                    TurfX Box Cricket · {formData.customerPhone || 'Demo Customer'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Tabs & Payment Methods */}
            <div className="p-6 space-y-6">
              
              {/* Amount Banner */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total Payable Amount
                  </span>
                  <p className="font-headline font-bold text-2xl text-primary">
                    ₹{totalAmount}
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                  Instant Verification
                </span>
              </div>

              {/* Method Selector Tabs */}
              <div className="grid grid-cols-4 gap-2 border-b border-gray-100 pb-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('upi')}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                    activeTab === 'upi'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                    activeTab === 'card'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cards</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('netbanking')}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                    activeTab === 'netbanking'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Netbanking</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('wallet')}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                    activeTab === 'wallet'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>Wallets</span>
                </button>
              </div>

              {/* Tab Content Panels */}
              {activeTab === 'upi' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="grid grid-cols-3 gap-2.5">
                    {['Google Pay', 'PhonePe', 'Paytm UPI'].map((app) => (
                      <div
                        key={app}
                        className="border border-emerald-200 bg-emerald-50/50 p-3 rounded-xl flex items-center justify-center text-center cursor-pointer hover:border-emerald-500 transition-all font-semibold text-xs text-on-surface"
                      >
                        {app}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Simulated UPI ID: <span className="font-mono font-bold text-on-surface">player@razorpay</span>
                  </p>
                </div>
              )}

              {activeTab === 'card' && (
                <div className="space-y-2 animate-fade-in bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs">
                  <div className="flex justify-between font-mono text-gray-600">
                    <span>Card: •••• •••• •••• 4242</span>
                    <span>EXP: 12/28</span>
                  </div>
                  <p className="text-gray-400">Pre-filled Demo Test Card (No actual card required)</p>
                </div>
              )}

              {activeTab === 'netbanking' && (
                <div className="grid grid-cols-2 gap-2 animate-fade-in text-xs font-semibold">
                  {['HDFC Bank (Demo)', 'SBI (Demo)', 'ICICI Bank (Demo)', 'Axis Bank (Demo)'].map((b) => (
                    <div
                      key={b}
                      className="border border-gray-200 bg-gray-50 p-2.5 rounded-xl text-center cursor-pointer hover:border-primary transition-all text-on-surface"
                    >
                      {b}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className="grid grid-cols-2 gap-2 animate-fade-in text-xs font-semibold">
                  {['Paytm Wallet', 'Amazon Pay', 'Mobikwik', 'Freecharge'].map((w) => (
                    <div
                      key={w}
                      className="border border-gray-200 bg-gray-50 p-2.5 rounded-xl text-center cursor-pointer hover:border-primary transition-all text-on-surface"
                    >
                      {w}
                    </div>
                  ))}
                </div>
              )}

              {/* Demo Action Button */}
              <div className="pt-2 space-y-2">
                <Button
                  onClick={handleCompleteDemoPayment}
                  loading={isProcessingPayment}
                  className="w-full py-4 text-base font-bold bg-[#0c2340] hover:bg-[#16365f] text-white rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  {paymentSuccessAnim ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
                      <span>Payment Verified!</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>Simulate Razorpay Success (₹{totalAmount})</span>
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-gray-400 text-center font-medium">
                  This simulated transaction reserves your real slot in MongoDB and generates match pass.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
