const express = require('express')
const router = express.Router()
const protect = require('../middleware/authMiddleware');

const {
  getGrounds,
  getGroundById,
  createGround,
  updateGround,
  deleteGround,
} = require('../controllers/groundController');

router.get('/', getGrounds);
router.get('/:id', getGroundById);
router.post('/',protect, createGround);
router.put('/:id',protect, updateGround);
router.delete('/:id',protect, deleteGround);

module.exports = router;