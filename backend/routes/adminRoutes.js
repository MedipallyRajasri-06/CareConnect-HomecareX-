const express = require('express');
const { listUsers, createStaffUser, setUserStatus, listAuditLogs } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/users', protect, authorize('admin', 'operations_manager'), listUsers);
router.post('/users', protect, authorize('admin'), createStaffUser);
router.put('/users/:id/status', protect, authorize('admin'), setUserStatus);
router.get('/audit-logs', protect, authorize('admin', 'operations_manager'), listAuditLogs);

module.exports = router;
