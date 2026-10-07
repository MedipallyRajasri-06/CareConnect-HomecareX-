const express = require('express');
const {
  createRequest,
  listRequests,
  getRequest,
  updateCategory,
  matchProviders,
  cancelRequest,
  directBookProvider,
} = require('../controllers/requestController');
const { createQuote, listQuotesForRequest } = require('../controllers/quoteController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, authorize('customer'), createRequest);
router.get('/', protect, listRequests);
router.get('/:id', protect, getRequest);
router.put('/:id/category', protect, updateCategory);
router.post('/:id/match', protect, authorize('customer', 'admin', 'operations_manager'), matchProviders);
router.post('/:id/book-provider', protect, authorize('customer'), directBookProvider);
router.put('/:id/cancel', protect, cancelRequest);

router.post('/:requestId/quotes', protect, authorize('provider'), createQuote);
router.get('/:requestId/quotes', protect, listQuotesForRequest);

module.exports = router;
