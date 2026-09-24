const express = require('express');
const { overview, providerAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', protect, authorize('admin', 'operations_manager'), overview);
router.get('/provider', protect, authorize('provider'), providerAnalytics);

module.exports = router;
