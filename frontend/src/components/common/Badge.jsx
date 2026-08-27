import React from 'react';

export default function Badge({ variant = 'available', children, className = '' }) {
  const variantStyles = {
    // Green = availability + success + confirmed/paid
    available: 'bg-emerald-50 text-secondary border border-emerald-200/50',
    confirmed: 'bg-[#6cf8bb]/20 text-[#006c49] border border-[#6cf8bb]/40 font-medium',
    paid: 'bg-emerald-50 text-[#006c49] border border-emerald-200/60 font-medium',
    
    // Orange = peak pricing + urgency + pending
    peak: 'bg-amber-50 text-[#885500] border border-amber-200/60 font-medium',
    pending: 'bg-amber-50 text-[#b45309] border border-amber-200/60 font-medium',
    urgent: 'bg-amber-50 text-[#b45309] border border-amber-200/60 font-medium',
    highDemand: 'bg-[#ffd4a4]/30 text-[#885500] border border-[#ffd4a4] font-medium',

    // Booked / Blocked / Cancelled / Error
    booked: 'bg-gray-100 text-gray-500 border border-gray-200 font-medium',
    blocked: 'bg-amber-50 text-[#b45309] border border-amber-200 font-medium',
    maintenance: 'bg-amber-50 text-[#b45309] border border-amber-200 font-medium',
    cancelled: 'bg-red-50 text-error border border-red-200 font-medium',
    failed: 'bg-red-50 text-error border border-red-200 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-sans tracking-tight transition-colors ${
        variantStyles[variant] || variantStyles.available
      } ${className}`}
    >
      {children}
    </span>
  );
}
