import React from 'react';
import {
  Settings,
  ShieldCheck,
  Clock,
  Banknote,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  Mail,
  User,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 max-w-7xl">
        
        {/* HEADER */}
        <div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-on-surface tracking-tight">
            Settings & Policy Controls
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant font-sans mt-1">
            Configure venue operating guidelines, graduated cancellation & refund matrices, and pricing rules.
          </p>
        </div>

        {/* CANCELLATION & REFUND POLICY MATRIX (Highlighted Policy Card) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-primary/20 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-headline font-bold text-xl text-on-surface">
                  Graduated Cancellation & Refund Policy
                </h2>
                <p className="text-xs text-gray-500 font-sans">
                  Automated tiered refunds calculated at cancellation time and pending admin approval.
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Live Rule Engine
            </span>
          </div>

          {/* Refund Tiers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tier 1: 80% Refund */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">&gt; 20 Hours</span>
                <span className="font-headline font-bold text-lg text-emerald-700">80%</span>
              </div>
              <p className="font-headline font-bold text-base text-on-surface">
                Early Cancellation
              </p>
              <p className="text-xs text-gray-600">
                Cancelled more than 20 hours before match time. Eligible for ₹480 refund.
              </p>
            </div>

            {/* Tier 2: 60% Refund */}
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">12 – 20 Hours</span>
                <span className="font-headline font-bold text-lg text-primary">60%</span>
              </div>
              <p className="font-headline font-bold text-base text-on-surface">
                Standard Cancellation
              </p>
              <p className="text-xs text-gray-600">
                Cancelled between 12 to 20 hours before match. Eligible for ₹360 refund.
              </p>
            </div>

            {/* Tier 3: 40% Refund */}
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">6 – 12 Hours</span>
                <span className="font-headline font-bold text-lg text-amber-700">40%</span>
              </div>
              <p className="font-headline font-bold text-base text-on-surface">
                Late Cancellation
              </p>
              <p className="text-xs text-gray-600">
                Cancelled between 6 to 12 hours before match. Eligible for ₹240 refund.
              </p>
            </div>

            {/* Tier 4: 0% Non-refundable */}
            <div className="p-5 rounded-2xl bg-red-50/70 border border-red-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-800 uppercase tracking-wider">2 – 6 Hours</span>
                <span className="font-headline font-bold text-lg text-error">0%</span>
              </div>
              <p className="font-headline font-bold text-base text-on-surface">
                Non-Refundable
              </p>
              <p className="text-xs text-gray-600">
                Slot is freed up, but no refund is issued for cancellations under 6 hours.
              </p>
            </div>
          </div>

          {/* Reschedule & Cutoff Rules */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary shrink-0" />
              <div>
                <strong className="text-on-surface font-semibold">Rescheduling Policy: </strong>
                <span className="text-gray-600">
                  Players are allowed to reschedule only up to <strong>4 hours prior to match time</strong>.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong className="text-on-surface font-semibold">Cancellation Cutoff: </strong>
                <span className="text-gray-600">
                  Cancellations are completely locked within <strong>2 hours of match time</strong>.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TWO-COLUMN GRID: VENUE CONFIG & SYSTEM INFO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* VENUE CONFIGURATION */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  Venue & Schedule Details
                </h3>
                <p className="text-xs text-gray-400">Green Box Cricket (Single Venue Mode)</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Venue Name</span>
                <span className="font-semibold text-on-surface">Green Box Cricket</span>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Location</span>
                <span className="font-semibold text-on-surface">Gachibowli, Hyderabad</span>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Operating Hours</span>
                <span className="font-semibold text-on-surface">06:00 AM – 11:00 PM (17 daily slots)</span>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Standard Slot Price</span>
                <span className="font-headline font-bold text-primary">₹600 / hour</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-gray-500">Peak Hours (Weekend / Evening)</span>
                <span className="font-headline font-bold text-secondary">₹900 / hour</span>
              </div>
            </div>
          </div>

          {/* ADMIN PROFILE & SYSTEM GATEWAY */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-secondary flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  System & Gateway Status
                </h3>
                <p className="text-xs text-gray-400">Demo sandbox integration</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Admin Account</span>
                <span className="font-semibold text-on-surface">admin@turfx.com</span>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Payment Gateway</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  Razorpay Demo Sandbox
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Database Connection</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  MongoDB Atlas (Active)
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-gray-500">Refund Approval Workflow</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  Admin Approval Required
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
