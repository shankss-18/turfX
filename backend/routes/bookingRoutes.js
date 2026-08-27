const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  createBooking,
  getBooking,
  verifyPayment,
  lookupBooking,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  getAuditRefunds,
  approveRefund,
  rejectRefund,
} = require('../controllers/bookingController');

// Public lookup & single booking
router.get('/lookup', lookupBooking);

// Admin refund audit list (grouped by date)
router.get('/audit', protect, getAuditRefunds);
router.get('/refunds', protect, getAuditRefunds);

// Single booking
router.get('/:id', getBookingById);

// Public booking creation & payment flow
router.post('/', createBooking);
router.post('/verify-payment', verifyPayment);

// User Manage actions: Cancel & Reschedule
router.post('/:id/cancel', cancelBooking);
router.post('/:id/reschedule', rescheduleBooking);

// Admin Refund Approvals
router.post('/:id/approve-refund', protect, approveRefund);
router.post('/:id/reject-refund', protect, rejectRefund);

// Admin only list
router.get('/', protect, getBooking);

module.exports = router;