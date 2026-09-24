const Booking = require('../models/Booking');
const ProviderProfile = require('../models/ProviderProfile');
const ServiceRequest = require('../models/ServiceRequest');
const Invoice = require('../models/Invoice');
const Review = require('../models/Review');
const Message = require('../models/Message');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { notify } = require('../services/notificationService');
const { audit } = require('../services/auditService');

const genInvoiceNumber = () => `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;

// @route GET /api/bookings
const listBookings = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  if (req.user.role === 'customer') filter.customer = req.user._id;
  if (req.user.role === 'provider') {
    const profile = await ProviderProfile.findOne({ user: req.user._id });
    filter.provider = profile ? profile._id : null;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    Booking.find(filter)
      .populate('customer', 'name avatarColor phone')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name avatarColor phone' } })
      .populate('category', 'name icon')
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Booking.countDocuments(filter),
  ]);

  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total } });
});

// @route GET /api/bookings/:id
const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('customer', 'name avatarColor phone email')
    .populate({ path: 'provider', populate: { path: 'user', select: 'name avatarColor phone email' } })
    .populate('category', 'name icon')
    .populate('serviceRequest')
    .populate('updates.updatedBy', 'name role');
  if (!booking) throw new ApiError(404, 'Booking not found.');
  const review = await Review.findOne({ booking: booking._id });
  const data = booking.toObject();
  data.review = review;
  res.json({ success: true, data });
});

// @route PUT /api/bookings/:id/status  (provider updates job progress)
const updateStatus = asyncHandler(async (req, res) => {
  const { status, note, attachments } = req.body;
  const validStatuses = ['in_progress', 'completed'];
  if (!validStatuses.includes(status)) throw new ApiError(400, 'Invalid status transition.');

  const booking = await Booking.findById(req.params.id).populate('provider').populate('customer', 'name');
  if (!booking) throw new ApiError(404, 'Booking not found.');

  const isProvider = String(booking.provider.user) === String(req.user._id);
  const isStaff = ['admin', 'operations_manager'].includes(req.user.role);
  if (!isProvider && !isStaff) throw new ApiError(403, 'Not authorized.');

  booking.status = status;
  booking.updates.push({ status, note, attachments: attachments || [], updatedBy: req.user._id });
  await booking.save();

  if (status === 'completed') {
    const provider = await ProviderProfile.findById(booking.provider._id);
    provider.completedJobs += 1;
    await provider.save();

    await ServiceRequest.findByIdAndUpdate(booking.serviceRequest, { status: 'completed' });

    // Auto-generate invoice
    const existingInvoice = await Invoice.findOne({ booking: booking._id });
    if (!existingInvoice) {
      const platformFee = Math.round(booking.price * 0.1 * 100) / 100;
      const tax = Math.round(booking.price * 0.05 * 100) / 100;
      await Invoice.create({
        booking: booking._id,
        customer: booking.customer._id,
        provider: booking.provider._id,
        invoiceNumber: genInvoiceNumber(),
        lineItems: [{ description: 'Service charge', amount: booking.price }],
        subtotal: booking.price,
        platformFee,
        tax,
        total: Math.round((booking.price + platformFee + tax) * 100) / 100,
      });
    }

    await notify({
      user: booking.customer._id,
      type: 'job_completed',
      title: 'Job completed',
      message: `Your booking has been marked complete. Please confirm and leave a review.`,
      link: `/customer/bookings/${booking._id}`,
    });
  } else {
    await notify({
      user: booking.customer._id,
      type: 'job_update',
      title: 'Job update',
      message: note || `Job status updated to "${status}".`,
      link: `/customer/bookings/${booking._id}`,
    });
  }

  res.json({ success: true, data: booking });
});

// @route PUT /api/bookings/:id/confirm  (customer confirms completion)
const confirmCompletion = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found.');
  if (String(booking.customer) !== String(req.user._id)) throw new ApiError(403, 'Not authorized.');
  if (booking.status !== 'completed') throw new ApiError(400, 'Job must be marked completed by the provider first.');

  booking.customerConfirmedAt = new Date();
  await booking.save();
  res.json({ success: true, data: booking });
});

// @route PUT /api/bookings/:id/cancel
const cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const booking = await Booking.findById(req.params.id).populate('provider');
  if (!booking) throw new ApiError(404, 'Booking not found.');

  const isOwner = String(booking.customer) === String(req.user._id);
  const isProvider = String(booking.provider.user) === String(req.user._id);
  const isStaff = ['admin', 'operations_manager'].includes(req.user.role);
  if (!isOwner && !isProvider && !isStaff) throw new ApiError(403, 'Not authorized.');
  if (['completed', 'cancelled'].includes(booking.status)) throw new ApiError(400, `Booking already ${booking.status}.`);

  booking.status = 'cancelled';
  booking.cancellationReason = reason || 'No reason provided';
  booking.cancelledBy = req.user._id;
  await booking.save();

  // free up the provider slot
  const providerProfile = await ProviderProfile.findById(booking.provider._id);
  const slot = providerProfile.availability.id(booking.slotId);
  if (slot) {
    slot.isBooked = false;
    slot.bookingId = null;
    await providerProfile.save();
  }

  await ServiceRequest.findByIdAndUpdate(booking.serviceRequest, { status: 'cancelled', cancellationReason: reason });

  const notifyTarget = isOwner ? providerProfile.user : booking.customer;
  await notify({
    user: notifyTarget,
    type: 'job_update',
    title: 'Booking cancelled',
    message: `A booking was cancelled. Reason: ${reason || 'Not specified'}`,
    link: `/bookings/${booking._id}`,
  });

  await audit({ actor: req.user, action: 'BOOKING_CANCELLED', entityType: 'Booking', entityId: booking._id, details: { reason } });

  res.json({ success: true, data: booking });
});

// @route GET /api/bookings/:id/messages
const getBookingMessages = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('provider');
  if (!booking) throw new ApiError(404, 'Booking not found.');

  const isCustomer = String(booking.customer) === String(req.user._id);
  const isProvider = String(booking.provider.user) === String(req.user._id);
  const isStaff = ['admin', 'operations_manager', 'support_agent'].includes(req.user.role);
  if (!isCustomer && !isProvider && !isStaff) throw new ApiError(403, 'Not authorized to view messages for this booking.');

  const messages = await Message.find({ booking: booking._id })
    .populate('sender', 'name avatarColor role')
    .sort({ createdAt: 1 });

  // Mark messages from other user as read
  await Message.updateMany(
    { booking: booking._id, sender: { $ne: req.user._id }, read: false },
    { read: true, readAt: new Date() }
  );

  res.json({ success: true, data: messages });
});

// @route POST /api/bookings/:id/messages
const sendBookingMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) throw new ApiError(400, 'Message text is required.');

  const booking = await Booking.findById(req.params.id)
    .populate('provider')
    .populate('customer', 'name');
  if (!booking) throw new ApiError(404, 'Booking not found.');

  const isCustomer = String(booking.customer._id || booking.customer) === String(req.user._id);
  const isProvider = String(booking.provider.user) === String(req.user._id);
  const isStaff = ['admin', 'operations_manager', 'support_agent'].includes(req.user.role);
  if (!isCustomer && !isProvider && !isStaff) throw new ApiError(403, 'Not authorized to send messages for this booking.');

  const message = await Message.create({
    booking: booking._id,
    sender: req.user._id,
    senderRole: req.user.role,
    text: text.trim(),
  });

  const populated = await Message.findById(message._id).populate('sender', 'name avatarColor role');

  // Notify the recipient party
  if (isProvider) {
    // Provider sent message -> notify customer
    await notify({
      user: booking.customer._id || booking.customer,
      type: 'chat_message',
      title: `Message from ${req.user.name}`,
      message: text.trim(),
      link: `/customer/bookings/${booking._id}`,
    });
  } else if (isCustomer) {
    // Customer sent message -> notify provider
    await notify({
      user: booking.provider.user,
      type: 'chat_message',
      title: `Message from ${req.user.name}`,
      message: text.trim(),
      link: `/provider/jobs/${booking._id}`,
    });
  }

  res.status(201).json({ success: true, data: populated });
});

module.exports = {
  listBookings,
  getBooking,
  updateStatus,
  confirmCompletion,
  cancelBooking,
  getBookingMessages,
  sendBookingMessage,
};

