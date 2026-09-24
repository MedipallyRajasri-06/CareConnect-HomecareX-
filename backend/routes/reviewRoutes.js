const express = require('express');
const { respondToReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.put('/:id/respond', protect, authorize('provider'), respondToReview);

module.exports = router;
