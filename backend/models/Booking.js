const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
      required: true,
    },
    slots: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Slot',
      },
    ],
    ground: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ground',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'rescheduled'],
      default: 'confirmed',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'refund_pending'],
      default: 'pending',
    },
    refundPercentage: {
      type: Number,
      default: 0,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    refundProcessedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    hoursBeforeCancellation: {
      type: Number,
    },
    cancellationTier: {
      type: String,
    },
    rescheduledAt: {
      type: Date,
    },
    previousSlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Slot',
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);