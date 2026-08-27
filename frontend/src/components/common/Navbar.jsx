import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Menu, X, Calendar, Home as HomeIcon, BookmarkCheck, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCurrent = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2 group">
          <span className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight group-hover:opacity-90 transition-opacity">
            TurfX
          </span>
        </Link>

        {/* Center Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors ${
              isCurrent('/')
                ? 'text-primary font-semibold border-b-2 border-primary pb-1'
                : 'text-on-surface hover:text-primary'
            }`}
          >
            Home
          </Link>
          <Link
            to="/book"
            className={`text-sm font-medium transition-colors ${
              isCurrent('/book')
                ? 'text-primary font-semibold border-b-2 border-primary pb-1'
                : 'text-on-surface hover:text-primary'
            }`}
          >
            Book Now
          </Link>
          <Link
            to="/manage-booking"
            className={`text-sm font-medium transition-colors ${
              isCurrent('/manage-booking') || isCurrent('/manage')
                ? 'text-primary font-semibold border-b-2 border-primary pb-1'
                : 'text-on-surface hover:text-primary'
            }`}
          >
            Manage Booking
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to={isAuthenticated ? "/admin" : "/admin/login"}
            className="p-2 text-on-surface hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
            title={isAuthenticated ? "Admin Dashboard" : "Admin Login"}
            aria-label="Admin Profile"
          >
            <User className="w-5 h-5" />
          </Link>

          <Link
            to="/book"
            className="hidden sm:inline-flex items-center justify-center bg-primary hover:bg-[#2d1eb3] text-white font-headline font-semibold text-sm px-6 py-2.5 rounded-xl shadow-surface-1 hover:shadow-surface-2 active:scale-95 transition-all"
          >
            Book Now
          </Link>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-gray-600 hover:text-primary hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-6 space-y-4 shadow-lg animate-fade-in">
          <nav className="flex flex-col space-y-2">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                isCurrent('/') ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-gray-50'
              }`}
            >
              <HomeIcon className="w-4 h-4" />
              <span>Home</span>
            </Link>

            <Link
              to="/book"
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                isCurrent('/book') ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Book Slot</span>
            </Link>

            <Link
              to="/manage-booking"
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                isCurrent('/manage-booking') ? 'bg-primary/10 text-primary' : 'text-on-surface hover:bg-gray-50'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>Manage Booking / Refund</span>
            </Link>

            <Link
              to={isAuthenticated ? "/admin" : "/admin/login"}
              onClick={closeMobileMenu}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Shield className="w-4 h-4 text-primary" />
              <span>{isAuthenticated ? 'Admin Dashboard' : 'Admin Login'}</span>
            </Link>
          </nav>

          <div className="pt-2">
            <Link
              to="/book"
              onClick={closeMobileMenu}
              className="w-full inline-flex items-center justify-center bg-primary hover:bg-[#2d1eb3] text-white font-headline font-semibold text-sm py-3 rounded-xl shadow-md active:scale-95 transition-all"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
