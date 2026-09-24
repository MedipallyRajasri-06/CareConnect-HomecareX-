const express = require('express');
const {
  listDisputes,
  getDispute,
  assignDispute,
  addMessage,
  resolveDispute,
} = require('../controllers/disputeController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, listDisputes);
router.get('/:id', protect, getDispute);
router.put('/:id/assign', protect, authorize('admin', 'operations_manager', 'support_agent'), assignDispute);
router.post('/:id/messages', protect, addMessage);
router.put('/:id/resolve', protect, authorize('admin', 'operations_manager', 'support_agent'), resolveDispute);

module.exports = router;
