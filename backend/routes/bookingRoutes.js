const express = require('express');
const {
  listBookings,
  getBooking,
  updateStatus,
  confirmCompletion,
  cancelBooking,
  getBookingMessages,
  sendBookingMessage,
  updateTracking,
  claimWarranty,
  initiateMaskedCall,
  repeatBooking,
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
router.put('/:id/tracking', protect, authorize('provider', 'admin', 'operations_manager'), updateTracking);
router.post('/:id/warranty-claim', protect, authorize('customer'), claimWarranty);
router.post('/:id/masked-call', protect, initiateMaskedCall);
router.post('/:id/repeat', protect, authorize('customer'), repeatBooking);
router.put('/:id/confirm', protect, authorize('customer'), confirmCompletion);
router.put('/:id/cancel', protect, cancelBooking);
router.post('/:bookingId/review', protect, authorize('customer'), createReview);
router.post('/:bookingId/disputes', protect, createDispute);

module.exports = router;
