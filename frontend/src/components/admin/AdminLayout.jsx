import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Receipt,
  Settings,
  LogOut,
  Plus,
  User,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Slots', path: '/admin/slots', icon: Calendar },
    { label: 'Bookings', path: '/admin/bookings', icon: BookOpen },
    { label: 'Refunds & Audit', path: '/admin/refunds', icon: Receipt },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const isCurrent = (path) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col lg:flex-row text-on-surface">
      
      {/* MOBILE TOP BAR (visible on screens < lg) */}
      <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Open Admin Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <Link to="/admin" className="font-headline font-bold text-xl text-primary tracking-tight">
            TurfX Admin
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/book"
            className="p-2 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Booking</span>
          </Link>

          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* MOBILE SLIDE-OVER DRAWER BACKDROP & MENU */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={closeMobileNav}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Drawer Content */}
          <div className="relative bg-white w-72 max-w-[80vw] h-full shadow-2xl flex flex-col justify-between p-6 z-10 animate-fade-in overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="font-headline font-bold text-xl text-primary">TurfX Admin</h2>
                  <p className="text-xs text-gray-500 font-medium">Venue Manager</p>
                </div>
                <button
                  type="button"
                  onClick={closeMobileNav}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-on-surface hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile card */}
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-surface-low border border-gray-100">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="font-headline font-semibold text-xs text-on-surface truncate">Admin Profile</p>
                  <p className="text-[11px] text-gray-500 truncate">admin@turfx.com</p>
                </div>
              </div>

              {/* New Booking Button */}
              <Link
                to="/book"
                onClick={closeMobileNav}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#2d1eb3] text-white font-headline font-semibold text-sm py-3 px-4 rounded-xl shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Booking</span>
              </Link>

              {/* Nav links */}
              <nav className="space-y-1.5 pt-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isCurrent(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileNav}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary text-white shadow-sm font-semibold'
                          : 'text-on-surface hover:bg-surface-low hover:text-primary'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-100 pt-4 mt-6">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-error hover:bg-red-50/60 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP FIXED SIDEBAR (visible on screens >= lg) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200/80 fixed top-0 bottom-0 left-0 z-30 flex-col justify-between p-6 overflow-y-auto">
        
        {/* Top Section */}
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="space-y-1">
            <Link to="/admin" className="font-headline font-bold text-xl text-primary block tracking-tight">
              TurfX Admin
            </Link>
            <p className="text-xs text-on-surface-variant font-medium">
              Venue Manager
            </p>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-surface-low border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="font-headline font-semibold text-xs text-on-surface truncate">
                Admin Profile
              </p>
              <p className="text-[11px] text-on-surface-variant truncate">
                Venue Manager
              </p>
            </div>
          </div>

          {/* New Booking CTA */}
          <Link
            to="/book"
            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#2d1eb3] text-white font-headline font-semibold text-sm py-2.5 px-4 rounded-xl shadow-surface-1 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isCurrent(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-primary text-white shadow-sm font-semibold'
                      : 'text-on-surface hover:bg-surface-low hover:text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logout Button */}
        <div className="border-t border-gray-100 pt-4 mt-6">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-error hover:bg-red-50/60 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

      </aside>

      {/* RIGHT MAIN CONTENT AREA — responsive margin on desktop */}
      <div className="flex-1 lg:ml-64 min-w-0 min-h-screen flex flex-col">
        {children}
      </div>

    </div>
  );
}
