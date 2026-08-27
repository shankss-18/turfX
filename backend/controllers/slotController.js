const Slot = require('../models/Slot');
const Ground = require('../models/Ground');
const Booking = require('../models/Booking');

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const pad = (num) => String(num).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}`;
};

const generateSlots = async (req, res) => {
  try {
    const { groundId, date } = req.body;
    const ground = await Ground.findById(groundId);
    if (!ground) {
      return res.status(404).json({ message: 'Ground not found' });
    }

    const openMins = timeToMinutes(ground.openTime);
    const closeMins = timeToMinutes(ground.closeTime);
    const duration = ground.slotDurationMins;

    const slotsToCreate = [];

    for (let start = openMins; start < closeMins; start += duration) {
      const end = start + duration;

      slotsToCreate.push({
        ground: ground._id,
        date: date,
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
        price: ground.pricePerSlot,
      });
    }

    const created = await Slot.insertMany(slotsToCreate, { ordered: false });
    res.status(201).json({ message: `${created.length} slots created` });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(200).json({ message: 'Slots already exist for this date' });
    }
    res.status(500).json({ message: 'Failed to generate slots', error: err.message });
  }
};

const getSlots = async (req, res) => {
  try {
    const groundId = req.query.groundId || req.body?.groundId;
    const date = req.query.date || req.body?.date;
    const query = {};
    if (groundId) query.ground = groundId;
    if (date) query.date = date;
    const slots = await Slot.find(query).sort({ startTime: 1 });
    res.status(200).json(slots);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch slots', error: err.message });
  }
};

// Convert DD-MM-YYYY + HH:MM to a JS Date in local time
function slotToDate(dateStr, timeStr) {
  const [dd, mm, yyyy] = dateStr.split('-');
  const [hh, min] = timeStr.split(':');
  return new Date(
    parseInt(yyyy),
    parseInt(mm) - 1,
    parseInt(dd),
    parseInt(hh),
    parseInt(min),
    0,
    0
  );
}

// DELETE /api/slots/past  — removes available/blocked slots whose endTime has passed
const deleteExpiredSlots = async (req, res) => {
  try {
    const now = new Date();

    const candidates = await Slot.find({
      status: { $in: ['available', 'blocked'] },
    });

    const expiredIds = candidates
      .filter((slot) => {
        try {
          const slotEnd = slotToDate(slot.date, slot.endTime);
          return slotEnd <= now;
        } catch {
          return false;
        }
      })
      .map((slot) => slot._id);

    if (expiredIds.length === 0) {
      return res.status(200).json({ message: 'No expired slots found', deleted: 0 });
    }

    const result = await Slot.deleteMany({ _id: { $in: expiredIds } });
    res.status(200).json({
      message: `Deleted ${result.deletedCount} expired slot(s)`,
      deleted: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete expired slots', error: err.message });
  }
};

// GET /api/slots/:id/booking — Admin view booking details for a booked slot
const getSlotBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOne({
      $or: [{ slot: id }, { slots: id }],
    })
      .sort({ createdAt: -1 })
      .populate('slot')
      .populate('slots')
      .populate('ground');

    if (!booking) {
      return res.status(404).json({ message: 'No booking record found for this slot' });
    }

    res.status(200).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch slot booking details', error: err.message });
  }
};

// PATCH /api/slots/:id/status — Admin can block/unblock OR cancel/free a booked slot
const updateSlotStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const slot = await Slot.findById(id);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    // Prevent modifying slots whose time has passed
    try {
      const slotStart = slotToDate(slot.date, slot.startTime);
      if (slotStart <= new Date()) {
        return res.status(400).json({
          message: 'Cannot block, unblock or cancel a slot whose time has already passed',
        });
      }
    } catch (e) {
      // Date parse safety
    }

    let newStatus = status;

    // If slot is booked and admin requests to cancel/free it
    if (slot.status === 'booked') {
      if (!newStatus || newStatus === 'available') {
        newStatus = 'available';
      }
      // Cancel active bookings linked to this slot
      await Booking.updateMany(
        {
          $or: [{ slot: slot._id }, { slots: slot._id }],
          status: { $ne: 'cancelled' },
        },
        { status: 'cancelled', paymentStatus: 'refunded' }
      );
    } else {
      // Toggle between available and blocked if not explicitly provided
      if (!newStatus) {
        newStatus = slot.status === 'blocked' ? 'available' : 'blocked';
      }
    }

    if (!['available', 'blocked', 'booked'].includes(newStatus)) {
      return res.status(400).json({ message: 'Invalid slot status' });
    }

    slot.status = newStatus;
    await slot.save();

    res.status(200).json({
      message: `Slot is now ${newStatus.toUpperCase()}`,
      slot,
    });
  } catch (err) {
    console.error('updateSlotStatus error:', err);
    res.status(500).json({ message: 'Failed to update slot status', error: err.message });
  }
};

module.exports = {
  generateSlots,
  getSlots,
  deleteExpiredSlots,
  getSlotBooking,
  updateSlotStatus,
};