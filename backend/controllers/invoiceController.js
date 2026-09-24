const Invoice = require('../models/Invoice');
const ProviderProfile = require('../models/ProviderProfile');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// @route GET /api/invoices
const listInvoices = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'customer') filter.customer = req.user._id;
  if (req.user.role === 'provider') {
    const profile = await ProviderProfile.findOne({ user: req.user._id });
    filter.provider = profile ? profile._id : null;
  }

  const invoices = await Invoice.find(filter)
    .populate('customer', 'name avatarColor')
    .populate({ path: 'provider', populate: { path: 'user', select: 'name avatarColor' } })
    .populate({ path: 'booking', populate: { path: 'category', select: 'name' } })
    .sort({ createdAt: -1 });

  res.json({ success: true, data: invoices });
});

// @route GET /api/invoices/:id
const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('customer', 'name email avatarColor address')
    .populate({ path: 'provider', populate: { path: 'user', select: 'name email avatarColor' } })
    .populate({ path: 'booking', populate: { path: 'category', select: 'name' } });
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  res.json({ success: true, data: invoice });
});

// @route PUT /api/invoices/:id/pay  (mock payment)
const markPaid = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw new ApiError(404, 'Invoice not found.');
  if (String(invoice.customer) !== String(req.user._id) && !['admin', 'operations_manager'].includes(req.user.role)) {
    throw new ApiError(403, 'Not authorized.');
  }
  invoice.status = 'paid';
  invoice.paidAt = new Date();
  await invoice.save();
  res.json({ success: true, data: invoice });
});

module.exports = { listInvoices, getInvoice, markPaid };
