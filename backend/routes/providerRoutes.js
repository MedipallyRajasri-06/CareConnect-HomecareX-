const express = require('express');
const {
  listProviders,
  getSmartRecommendations,
  getMyProfile,
  getProvider,
  updateMyProfile,
  addDocument,
  verifyProvider,
  addAvailabilitySlots,
  removeAvailabilitySlot,
} = require('../controllers/providerController');
const { listReviewsForProvider } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, listProviders);
router.get('/recommendations', protect, getSmartRecommendations);
router.get('/me', protect, authorize('provider'), getMyProfile);
router.put('/me', protect, authorize('provider'), updateMyProfile);
router.post('/me/documents', protect, authorize('provider'), addDocument);
router.post('/me/availability', protect, authorize('provider'), addAvailabilitySlots);
router.delete('/me/availability/:slotId', protect, authorize('provider'), removeAvailabilitySlot);
router.get('/:id', protect, getProvider);
router.get('/:providerId/reviews', protect, listReviewsForProvider);
router.put('/:id/verify', protect, authorize('admin', 'operations_manager'), verifyProvider);

module.exports = router;
