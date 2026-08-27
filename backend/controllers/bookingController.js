const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const razorpay = require('../config/razorpay');
const crypto = require('crypto');

function slotToDate(dateStr, timeStr) {
  const [dd, mm, yyyy] = dateStr.split('-');
  const [hh, min] = timeStr.split(':');
  return new Date(+yyyy, +mm - 1, +dd, +hh, +min, 0, 0);
}

// Calculate refund based on graduated policy:
// 80% refund if cancelled before 20 hours
// 60% refund if cancelled before 12 hours (12–20h)
// 40% refund if cancelled before 6 hours (6–12h)
// 0% refund if cancelled before 2 hours (2–6h, Non-refundable)
// < 2 hours: Cancellation not permitted
function calculateRefundTier(slotDateStr, slotStartTimeStr, totalAmount) {
  try {
    const slotDate = slotToDate(slotDateStr, slotStartTimeStr);
    const now = new Date();
    const diffHours = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 2) {
      return {
        allowed: false,
        percentage: 0,
        amount: 0,
        diffHours: Math.max(0, diffHours),
        reason: 'Cancellations close 2 hours prior to match time',
        tier: 'Closed (< 2 hrs)',
      };
    }

    if (diffHours >= 20) {
      const percentage = 80;
      return {
        allowed: true,
        percentage,
        amount: Math.round((totalAmount * percentage) / 100),
        diffHours,
        tier: '80% Refund (> 20 hrs before match)',
      };
    }

    if (diffHours >= 12) {
      const percentage = 60;
      return {
        allowed: true,
        percentage,
        amount: Math.round((totalAmount * percentage) / 100),
        diffHours,
        tier: '60% Refund (12–20 hrs before match)',
      };
    }

    if (diffHours >= 6) {
      const percentage = 40;
      return {
        allowed: true,
        percentage,
        amount: Math.round((totalAmount * percentage) / 100),
        diffHours,
        tier: '40% Refund (6–12 hrs before match)',
      };
    }

    // 2 to 6 hours
    return {
      allowed: true,
      percentage: 0,
      amount: 0,
      diffHours,
      tier: '0% Refund (2–6 hrs before match — Non-refundable)',
    };
  } catch (e) {
    return {
      allowed: true,
      percentage: 0,
      amount: 0,
      diffHours: 0,
      tier: 'Standard 0% Refund',
    };
  }
}

// POST /api/bookings — create booking + razorpay order
const createBooking = async (req, res) => {
  try {
    const {
      slotId,
      slotIds,
      groundId,
      customerName,
      customerEmail,
      customerPhone,
      amount,
    } = req.body;

    const targetSlotIds = Array.isArray(slotIds) && slotIds.length > 0
      ? slotIds
      : slotId
      ? [slotId]
      : [];

    if (targetSlotIds.length === 0) {
      return res.status(400).json({ message: 'No slot ID provided' });
    }

    // Verify all target slots are available
    const availableSlots = await Slot.find({
      _id: { $in: targetSlotIds },
      status: 'available',
    });

    if (availableSlots.length !== targetSlotIds.length) {
      return res.status(409).json({ message: 'One or more selected slots are no longer available' });
    }

    // Verify none of the selected slots are in the past
    const now = new Date();
    const isAnyPast = availableSlots.some((s) => {
      try {
        return slotToDate(s.date, s.startTime) <= now;
      } catch {
        return false;
      }
    });

    if (isAnyPast) {
      return res.status(400).json({ message: 'Cannot book a slot whose match time has already passed' });
    }

    // Mark slots as booked
    await Slot.updateMany(
      { _id: { $in: targetSlotIds } },
      { status: 'booked' }
    );

    const primarySlot = availableSlots[0];
    const totalAmount = amount || availableSlots.reduce((sum, s) => sum + (s.price || 600), 0);
    const targetGroundId = groundId || primarySlot.ground;

    const booking = await Booking.create({
      slot: primarySlot._id,
      slots: targetSlotIds,
      ground: targetGroundId,
      customerEmail,
      customerPhone,
      customerName,
      amount: totalAmount,
      status: 'confirmed',
      paymentStatus: 'pending',
    });

    // Create Razorpay Order if key is available
    let orderId = null;
    try {
      if (razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        const order = await razorpay.orders.create({
          amount: Math.round(totalAmount * 100), // amount in paise
          currency: 'INR',
          receipt: booking._id.toString(),
          notes: {
            bookingId: booking._id.toString(),
            customerName,
            customerPhone,
          },
        });
        orderId = order.id;
        booking.razorpayOrderId = orderId;
        await booking.save();
      }
    } catch (rzpErr) {
      console.warn('Razorpay order creation fallback (demo mode active):', rzpErr.message);
    }

    const populated = await Booking.findById(booking._id)
      .populate('slot')
      .populate('slots')
      .populate('ground');

    res.status(201).json({
      message: 'Booking created successfully',
      booking: populated,
      orderId,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('createBooking error:', err);
    res.status(500).json({ message: 'Failed to create booking', error: err.message });
  }
};

// GET /api/bookings — Admin list with population
const getBooking = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('slot')
      .populate('slots')
      .populate('ground')
      .populate('previousSlot')
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: err.message });
  }
};

// POST /api/bookings/verify-payment
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    if (process.env.RAZORPAY_KEY_SECRET && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification signature failed' });
      }
    }

    let booking;
    if (razorpay_order_id) {
      booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });
    }
    if (!booking && bookingId) {
      booking = await Booking.findById(bookingId);
    }

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found for payment verification' });
    }

    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    if (razorpay_payment_id) {
      booking.razorpayPaymentId = razorpay_payment_id;
    }
    if (razorpay_order_id) {
      booking.razorpayOrderId = razorpay_order_id;
    }
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('slot')
      .populate('slots')
      .populate('ground');

    res.status(200).json({
      message: 'Payment verified and booking confirmed',
      booking: populated,
    });
  } catch (err) {
    console.error('verifyPayment error:', err);
    res.status(500).json({ message: 'Payment verification failed', error: err.message });
  }
};

// GET /api/bookings/lookup — Query by ID, phone, or email
const lookupBooking = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Please provide a search query (Booking ID, Phone, or Email)' });
    }

    const searchCriteria = [];

    if (/^[0-9a-fA-F]{24}$/.test(query)) {
      searchCriteria.push({ _id: query });
    }

    const cleanCode = query.replace(/^#?TX/i, '');
    if (cleanCode.length >= 4) {
      const allBookings = await Booking.find()
        .populate('slot')
        .populate('slots')
        .populate('ground')
        .populate('previousSlot');
      const matched = allBookings.filter((b) =>
        b._id.toString().toUpperCase().endsWith(cleanCode.toUpperCase())
      );
      if (matched.length > 0) {
        return res.status(200).json(matched);
      }
    }

    searchCriteria.push({ customerPhone: { $regex: query, $options: 'i' } });
    searchCriteria.push({ customerEmail: { $regex: query, $options: 'i' } });

    const bookings = await Booking.find({ $or: searchCriteria })
      .populate('slot')
      .populate('slots')
      .populate('ground')
      .populate('previousSlot')
      .sort({ createdAt: -1 });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No booking found matching your details' });
    }

    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Error searching booking', error: err.message });
  }
};

// GET /api/bookings/:id — Get single booking details
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('slot')
      .populate('slots')
      .populate('ground')
      .populate('previousSlot');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.status(200).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get booking', error: err.message });
  }
};

// POST /api/bookings/:id/cancel — Cancel booking with graduated policy and refund calculation
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('slot');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'This booking is already cancelled' });
    }

    if (!booking.slot) {
      return res.status(400).json({ message: 'Slot details not found for this booking' });
    }

    // Graduated cancellation & refund calculation
    const refundInfo = calculateRefundTier(
      booking.slot.date,
      booking.slot.startTime,
      booking.amount || 600
    );

    if (!refundInfo.allowed) {
      return res.status(400).json({
        message: refundInfo.reason || 'Cannot cancel booking less than 2 hours before match time',
      });
    }

    // Release all associated slots
    const slotIds = Array.isArray(booking.slots) && booking.slots.length > 0
      ? booking.slots
      : booking.slot
      ? [booking.slot._id || booking.slot]
      : [];

    if (slotIds.length > 0) {
      await Slot.updateMany(
        { _id: { $in: slotIds } },
        { status: 'available' }
      );
    }

    booking.status = 'cancelled';
    booking.refundPercentage = refundInfo.percentage;
    booking.refundAmount = refundInfo.amount;
    booking.refundStatus = refundInfo.amount > 0 ? 'pending' : 'none';
    booking.paymentStatus = refundInfo.amount > 0 ? 'refund_pending' : 'refunded';
    booking.cancelledAt = new Date();
    booking.hoursBeforeCancellation = Math.round(refundInfo.diffHours * 10) / 10;
    booking.cancellationTier = refundInfo.tier;

    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('slot')
      .populate('slots')
      .populate('ground');

    res.status(200).json({
      message: `Booking cancelled successfully. ${
        refundInfo.amount > 0
          ? `Eligible for ₹${refundInfo.amount} (${refundInfo.percentage}% refund) pending admin approval.`
          : 'Cancellation recorded (Non-refundable tier).'
      }`,
      booking: populated,
      refundInfo,
    });
  } catch (err) {
    console.error('cancelBooking error:', err);
    res.status(500).json({ message: 'Failed to cancel booking', error: err.message });
  }
};

// POST /api/bookings/:id/reschedule — Reschedule only allowed up to 4 hours before slot
const rescheduleBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { newSlotId, newSlotIds } = req.body;

    const targetNewSlotIds = Array.isArray(newSlotIds) && newSlotIds.length > 0
      ? newSlotIds
      : newSlotId
      ? [newSlotId]
      : [];

    if (targetNewSlotIds.length === 0) {
      return res.status(400).json({ message: 'Please select a new slot to reschedule' });
    }

    const booking = await Booking.findById(id).populate('slot');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot reschedule a cancelled booking' });
    }

    // 4-Hour Reschedule Cutoff Rule
    if (booking.slot) {
      try {
        const slotDate = slotToDate(booking.slot.date, booking.slot.startTime);
        const diffHours = (slotDate.getTime() - Date.now()) / (1000 * 60 * 60);

        if (diffHours < 4) {
          return res.status(400).json({
            message: 'Rescheduling is only permitted at least 4 hours prior to match time',
          });
        }
      } catch (e) {
        // Date parse safety
      }
    }

    // Verify new slot(s) are available and not in the past
    const newSlots = await Slot.find({
      _id: { $in: targetNewSlotIds },
      status: 'available',
    });

    if (newSlots.length !== targetNewSlotIds.length) {
      return res.status(409).json({ message: 'The newly selected slot is no longer available' });
    }

    const now = new Date();
    const isAnyNewPast = newSlots.some((s) => {
      try {
        return slotToDate(s.date, s.startTime) <= now;
      } catch {
        return false;
      }
    });

    if (isAnyNewPast) {
      return res.status(400).json({ message: 'Cannot reschedule to a past slot' });
    }

    // 1. Free old slot(s)
    const oldSlotIds = Array.isArray(booking.slots) && booking.slots.length > 0
      ? booking.slots
      : booking.slot
      ? [booking.slot._id || booking.slot]
      : [];

    if (oldSlotIds.length > 0) {
      await Slot.updateMany(
        { _id: { $in: oldSlotIds } },
        { status: 'available' }
      );
    }

    // 2. Mark new slot(s) as booked
    await Slot.updateMany(
      { _id: { $in: targetNewSlotIds } },
      { status: 'booked' }
    );

    // 3. Update booking record
    booking.previousSlot = booking.slot._id || booking.slot;
    booking.slot = newSlots[0]._id;
    booking.slots = targetNewSlotIds;
    booking.status = 'rescheduled';
    booking.rescheduledAt = new Date();
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('slot')
      .populate('slots')
      .populate('ground')
      .populate('previousSlot');

    res.status(200).json({
      message: 'Match successfully rescheduled!',
      booking: populated,
    });
  } catch (err) {
    console.error('rescheduleBooking error:', err);
    res.status(500).json({ message: 'Failed to reschedule booking', error: err.message });
  }
};

// GET /api/bookings/audit — Admin view for cancelled and rescheduled slots grouped by date
const getAuditRefunds = async (req, res) => {
  try {
    const cancelledOrRescheduled = await Booking.find({
      $or: [
        { status: 'cancelled' },
        { status: 'rescheduled' },
        { refundStatus: { $in: ['pending', 'approved', 'rejected'] } },
      ],
    })
      .populate('slot')
      .populate('slots')
      .populate('ground')
      .populate('previousSlot')
      .sort({ updatedAt: -1 });

    res.status(200).json(cancelledOrRescheduled);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch refund audit records', error: err.message });
  }
};

// POST /api/bookings/:id/approve-refund — Admin approves refund
const approveRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('slot')
      .populate('slots')
      .populate('ground');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.refundStatus = 'approved';
    booking.paymentStatus = 'refunded';
    booking.refundProcessedAt = new Date();
    await booking.save();

    res.status(200).json({
      message: `Refund of ₹${booking.refundAmount} approved successfully!`,
      booking,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve refund', error: err.message });
  }
};

// POST /api/bookings/:id/reject-refund — Admin rejects refund
const rejectRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('slot')
      .populate('slots')
      .populate('ground');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.refundStatus = 'rejected';
    booking.refundProcessedAt = new Date();
    await booking.save();

    res.status(200).json({
      message: 'Refund request has been rejected',
      booking,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject refund', error: err.message });
  }
};

module.exports = {
  createBooking,
  getBooking,
  getBookingById,
  lookupBooking,
  cancelBooking,
  rescheduleBooking,
  verifyPayment,
  getAuditRefunds,
  approveRefund,
  rejectRefund,
};