import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200/70 bg-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-on-surface-variant">
        {/* Brand */}
        <div className="font-headline font-bold text-lg text-on-surface">
          TurfX
        </div>

        {/* Copyright */}
        <div className="text-xs sm:text-sm text-gray-500 order-3 md:order-2">
          © {new Date().getFullYear()} TurfX Box Cricket. All rights reserved.
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-xs sm:text-sm order-2 md:order-3">
          <a href="#privacy" className="hover:text-primary transition-colors">
            Privacy Policy
          </a>
          <a href="#terms" className="hover:text-primary transition-colors">
            Terms of Service
          </a>
          <a href="#contact" className="hover:text-primary transition-colors">
            Contact Us
          </a>
        </div>
      </div>
    </footer>
  );
}
