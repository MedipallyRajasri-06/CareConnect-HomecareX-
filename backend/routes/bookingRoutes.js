const express = require('express');
const {
  listBookings,
  getBooking,
  updateStatus,
  confirmCompletion,
  cancelBooking,
  getBookingMessages,
  sendBookingMessage,
} = require('../controllers/bookingController');
const { createReview } = require('../controllers/reviewController');
const { createDispute } = require('../controllers/disputeController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, listBookings);
router.get('/:id', protect, getBooking);
router.get('/:id/messages', protect, getBookingMessages);
router.post('/:id/messages', protect, sendBookingMessage);
router.put('/:id/status', protect, authorize('provider', 'admin', 'operations_manager'), updateStatus);
router.put('/:id/confirm', protect, authorize('customer'), confirmCompletion);
router.put('/:id/cancel', protect, cancelBooking);
router.post('/:bookingId/review', protect, authorize('customer'), createReview);
router.post('/:bookingId/disputes', protect, createDispute);

module.exports = router;
