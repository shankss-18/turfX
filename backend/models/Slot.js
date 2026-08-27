const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  ground: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ground',
    required: true,
  },
  date: {
    type: String,      
    required: true,
  },
  startTime: {
    type: String,      
    required: true,
  },
  endTime: {
    type: String,       
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'blocked'], 
    default: 'available',
  },
}, { timestamps: true });

slotSchema.index({ ground: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Slot', slotSchema);