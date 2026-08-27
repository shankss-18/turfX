import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-headline font-semibold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-md';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-7 py-3.5',
  };

  const variantStyles = {
    primary: 'bg-primary-container hover:bg-primary text-white shadow-surface-1 hover:shadow-surface-2 active:scale-[0.98]',
    secondary: 'bg-white hover:bg-surface-high text-on-surface border border-gray-200 shadow-surface-1',
    outline: 'bg-transparent border border-primary-container text-primary-container hover:bg-primary-light',
    ghost: 'bg-transparent hover:bg-surface-low text-on-surface',
    danger: 'bg-error text-white hover:bg-red-700 shadow-surface-1',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
