const express = require('express');
const { listInvoices, getInvoice, markPaid } = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, listInvoices);
router.get('/:id', protect, getInvoice);
router.put('/:id/pay', protect, markPaid);

module.exports = router;
