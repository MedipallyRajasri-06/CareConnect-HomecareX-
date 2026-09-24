const express = require('express');
const { myQuotes, acceptQuote, declineQuote, withdrawQuote } = require('../controllers/quoteController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/mine', protect, authorize('provider'), myQuotes);
router.put('/:id/accept', protect, authorize('customer'), acceptQuote);
router.put('/:id/decline', protect, authorize('customer'), declineQuote);
router.put('/:id/withdraw', protect, authorize('provider'), withdrawQuote);

module.exports = router;
