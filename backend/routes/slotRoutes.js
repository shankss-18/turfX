const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');

const {
  generateSlots,
  getSlots,
  deleteExpiredSlots,
  getSlotBooking,
  updateSlotStatus,
} = require('../controllers/slotController');

router.post('/generate', generateSlots);
router.delete('/past', protect, deleteExpiredSlots);
router.get('/:id/booking', protect, getSlotBooking);
router.patch('/:id/status', protect, updateSlotStatus);
router.patch('/:id', protect, updateSlotStatus);
router.get('/', getSlots);

module.exports = router;