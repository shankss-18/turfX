import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import BookSlot from './pages/BookSlot';
import Checkout from './pages/Checkout';
import Confirmation from './pages/Confirmation';
import ManageBooking from './pages/ManageBooking';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageSlots from './pages/admin/ManageSlots';
import BookingsList from './pages/admin/BookingsList';
import AdminRefunds from './pages/admin/AdminRefunds';
import AdminSettings from './pages/admin/AdminSettings';

// Protected Route wrapper for admin pages
export function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem('turfx_admin_token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isCheckoutRoute = location.pathname === '/checkout';
  const isConfirmationRoute = location.pathname === '/confirmation';

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      {/* Show public customer Navbar if not on admin, checkout, or confirmation route */}
      {!isAdminRoute && !isCheckoutRoute && !isConfirmationRoute && <Navbar />}

      <div className="flex-1 flex flex-col">
        <Routes>
          {/* Public customer pages */}
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<BookSlot />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/manage-booking" element={<ManageBooking />} />
          <Route path="/manage" element={<ManageBooking />} />

          {/* Admin pages */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/slots"
            element={
              <ProtectedAdminRoute>
                <ManageSlots />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedAdminRoute>
                <BookingsList />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/refunds"
            element={
              <ProtectedAdminRoute>
                <AdminRefunds />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedAdminRoute>
                <AdminSettings />
              </ProtectedAdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Show public customer Footer if not on admin, checkout, or confirmation route */}
      {!isAdminRoute && !isCheckoutRoute && !isConfirmationRoute && <Footer />}
    </div>
  );
}
