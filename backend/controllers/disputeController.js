const Dispute = require('../models/Dispute');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const ProviderProfile = require('../models/ProviderProfile');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { notify } = require('../services/notificationService');
const { audit } = require('../services/auditService');

// @route POST /api/bookings/:bookingId/disputes
const createDispute = asyncHandler(async (req, res) => {
  const { reason, category } = req.body;
  if (!reason) throw new ApiError(400, 'A reason is required to open a dispute.');

  const booking = await Booking.findById(req.params.bookingId).populate('provider').populate('customer', 'name');
  if (!booking) throw new ApiError(404, 'Booking not found.');

  const isOwner = String(booking.customer._id) === String(req.user._id);
  const isProvider = String(booking.provider.user) === String(req.user._id);
  if (!isOwner && !isProvider) throw new ApiError(403, 'Not authorized.');

  const dispute = await Dispute.create({
    booking: booking._id,
    raisedBy: req.user._id,
    reason,
    category: category || 'other',
    thread: [{ sender: req.user._id, message: reason }],
  });

  booking.status = 'disputed';
  await booking.save();

  // Notify the OTHER party (counter-party)
  const isCustomerRaised = String(dispute.raisedBy) === String(booking.customer._id);
  const otherPartyUserId = isCustomerRaised ? booking.provider.user : booking.customer._id;
  const otherPartyLink = isCustomerRaised ? `/provider/disputes/${dispute._id}` : `/disputes/${dispute._id}`;

  await notify({
    user: otherPartyUserId,
    type: 'dispute_opened',
    title: 'Dispute opened',
    message: `A dispute has been opened for booking on ${new Date(booking.scheduledDate).toDateString()}. Our support team will review it.`,
    link: otherPartyLink,
  });

  // Also send copy notification to support agents & operations managers
  const supportStaff = await User.find({
    role: { $in: ['support_agent', 'operations_manager'] },
    isActive: true,
  }).select('_id role');

  for (const staff of supportStaff) {
    const staffLink = staff.role === 'support_agent' ? `/support/${dispute._id}` : `/admin/disputes/${dispute._id}`;
    await notify({
      user: staff._id,
      type: 'dispute_opened',
      title: 'New dispute requires review',
      message: `A new dispute has been opened for booking on ${new Date(booking.scheduledDate).toDateString()}.`,
      link: staffLink,
    });
  }

  await audit({ actor: req.user, action: 'DISPUTE_OPENED', entityType: 'Dispute', entityId: dispute._id });

  res.status(201).json({ success: true, data: dispute });
});

// @route GET /api/disputes
const listDisputes = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  if (!['admin', 'operations_manager', 'support_agent'].includes(req.user.role)) {
    if (req.user.role === 'provider') {
      const profile = await ProviderProfile.findOne({ user: req.user._id });
      if (!profile) {
        return res.json({ success: true, data: [] });
      }
      const providerBookings = await Booking.find({ provider: profile._id }).distinct('_id');
      filter.$or = [
        { raisedBy: req.user._id },
        { booking: { $in: providerBookings } },
      ];
    } else {
      const customerBookings = await Booking.find({ customer: req.user._id }).distinct('_id');
      filter.$or = [
        { raisedBy: req.user._id },
        { booking: { $in: customerBookings } },
      ];
    }
  }

  const disputes = await Dispute.find(filter)
    .populate('raisedBy', 'name role avatarColor')
    .populate('assignedTo', 'name avatarColor')
    .populate({
      path: 'booking',
      populate: [
        { path: 'customer', select: 'name avatarColor' },
        { path: 'category', select: 'name icon' },
        { path: 'provider', populate: { path: 'user', select: 'name avatarColor' } },
      ],
    })
    .sort({ createdAt: -1 });

  res.json({ success: true, data: disputes });
});

// @route GET /api/disputes/:id
const getDispute = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id)
    .populate('raisedBy', 'name role avatarColor')
    .populate('assignedTo', 'name avatarColor')
    .populate('thread.sender', 'name role avatarColor')
    .populate({
      path: 'booking',
      populate: [
        { path: 'customer', select: 'name avatarColor' },
        { path: 'category', select: 'name' },
        { path: 'provider', populate: { path: 'user', select: 'name avatarColor' } },
      ],
    });
  if (!dispute) throw new ApiError(404, 'Dispute not found.');

  if (!['admin', 'operations_manager', 'support_agent'].includes(req.user.role)) {
    const isCustomer = String(dispute.booking?.customer?._id || dispute.booking?.customer) === String(req.user._id);
    const isProvider = String(dispute.booking?.provider?.user?._id || dispute.booking?.provider?.user) === String(req.user._id);
    const isRaisedBy = String(dispute.raisedBy?._id || dispute.raisedBy) === String(req.user._id);
    if (!isCustomer && !isProvider && !isRaisedBy) {
      throw new ApiError(403, 'Not authorized to view this dispute.');
    }
  }

  res.json({ success: true, data: dispute });
});

// @route PUT /api/disputes/:id/assign  (support_agent/admin/ops)
const assignDispute = asyncHandler(async (req, res) => {
  const { agentId } = req.body;
  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) throw new ApiError(404, 'Dispute not found.');

  dispute.assignedTo = agentId || req.user._id;
  dispute.status = 'investigating';
  await dispute.save();
  res.json({ success: true, data: dispute });
});

// @route POST /api/disputes/:id/messages
const addMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) throw new ApiError(400, 'Message cannot be empty.');

  const dispute = await Dispute.findById(req.params.id).populate({
    path: 'booking',
    populate: { path: 'provider' },
  });
  if (!dispute) throw new ApiError(404, 'Dispute not found.');

  const isCustomer = String(dispute.booking?.customer) === String(req.user._id);
  const isProvider = String(dispute.booking?.provider?.user) === String(req.user._id);
  const isRaisedBy = String(dispute.raisedBy) === String(req.user._id);
  const isStaff = ['admin', 'operations_manager', 'support_agent'].includes(req.user.role);

  if (!isCustomer && !isProvider && !isRaisedBy && !isStaff) {
    throw new ApiError(403, 'Not authorized.');
  }

  dispute.thread.push({ sender: req.user._id, message });
  await dispute.save();

  // Notify counter-party
  const recipientUserId = isCustomer
    ? dispute.booking?.provider?.user
    : dispute.booking?.customer;

  if (recipientUserId && String(recipientUserId) !== String(req.user._id)) {
    const isRecipientProvider = String(recipientUserId) === String(dispute.booking?.provider?.user);
    await notify({
      user: recipientUserId,
      type: 'dispute_message',
      title: 'New message on dispute',
      message: `${req.user.name}: "${message.slice(0, 60)}${message.length > 60 ? '...' : ''}"`,
      link: isRecipientProvider ? `/provider/disputes/${dispute._id}` : `/disputes/${dispute._id}`,
    });
  }

  res.status(201).json({ success: true, data: dispute });
});

// @route PUT /api/disputes/:id/resolve  (support_agent/admin/ops)
const resolveDispute = asyncHandler(async (req, res) => {
  const { resolution, resolutionAction, status } = req.body; // status: resolved | rejected
  const dispute = await Dispute.findById(req.params.id).populate('booking');
  if (!dispute) throw new ApiError(404, 'Dispute not found.');

  dispute.resolution = resolution;
  dispute.resolutionAction = resolutionAction || 'none';
  dispute.status = status === 'rejected' ? 'rejected' : 'resolved';
  dispute.resolvedAt = new Date();
  await dispute.save();

  if (resolutionAction === 'refund' || resolutionAction === 'partial_refund') {
    const invoice = await Invoice.findOne({ booking: dispute.booking._id });
    if (invoice) {
      invoice.status = 'refunded';
      await invoice.save();
    }
  }

  if (resolutionAction === 'provider_suspended') {
    const booking = await Booking.findById(dispute.booking._id);
    await ProviderProfile.findByIdAndUpdate(booking.provider, { isOnline: false, verificationStatus: 'rejected' });
  }

  // Notify customer
  if (dispute.booking?.customer) {
    await notify({
      user: dispute.booking.customer,
      type: 'dispute_resolved',
      title: `Dispute ${dispute.status}`,
      message: resolution || `Your dispute has been ${dispute.status}.`,
      link: `/disputes/${dispute._id}`,
    });
  }

  // Notify provider
  const booking = await Booking.findById(dispute.booking._id);
  if (booking?.provider) {
    const providerProfile = await ProviderProfile.findById(booking.provider);
    if (providerProfile?.user) {
      await notify({
        user: providerProfile.user,
        type: 'dispute_resolved',
        title: `Dispute ${dispute.status}`,
        message: resolution || `The dispute for your booking has been ${dispute.status}.`,
        link: `/provider/disputes/${dispute._id}`,
      });
    }
  }

  await audit({ actor: req.user, action: 'DISPUTE_RESOLVED', entityType: 'Dispute', entityId: dispute._id, details: { resolutionAction } });

  res.json({ success: true, data: dispute });
});

module.exports = { createDispute, listDisputes, getDispute, assignDispute, addMessage, resolveDispute };
