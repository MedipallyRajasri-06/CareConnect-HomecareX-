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
  const { status, note, attachments, currentLat, currentLng, distanceKm, estimatedArrivalMins } = req.body;
  const validStatuses = ['on_the_way', 'arrived', 'in_progress', 'completed'];
  if (!validStatuses.includes(status)) throw new ApiError(400, 'Invalid status transition.');

  const booking = await Booking.findById(req.params.id)
    .populate({ path: 'provider', populate: { path: 'user', select: 'name' } })
    .populate('customer', 'name');
  if (!booking) throw new ApiError(404, 'Booking not found.');

  const isProvider = String(booking.provider?.user?._id || booking.provider?.user) === String(req.user._id);
  const isStaff = ['admin', 'operations_manager'].includes(req.user.role);
  if (!isProvider && !isStaff) throw new ApiError(403, 'Not authorized.');

  booking.status = status;
  if (!booking.tracking) booking.tracking = {};
  booking.tracking.status = status;
  booking.tracking.lastUpdated = new Date();

  if (currentLat) booking.tracking.currentLat = currentLat;
  if (currentLng) booking.tracking.currentLng = currentLng;
  if (distanceKm !== undefined) booking.tracking.distanceKm = distanceKm;
  if (estimatedArrivalMins !== undefined) booking.tracking.estimatedArrivalMins = estimatedArrivalMins;

  booking.updates.push({ status, note, attachments: attachments || [], updatedBy: req.user._id });

  const providerName = booking.provider?.user?.name || 'Your professional';

  if (status === 'on_the_way') {
    booking.tracking.estimatedArrivalMins = estimatedArrivalMins || 15;
    booking.tracking.distanceKm = distanceKm || 3.4;
    await notify({
      user: booking.customer._id,
      type: 'professional_on_the_way',
      title: 'Professional is on the way! 🚗',
      message: `${providerName} is heading to your location. Estimated arrival in ~${booking.tracking.estimatedArrivalMins} mins. Track live!`,
      link: `/customer/bookings/${booking._id}`,
    });
  } else if (status === 'arrived') {
    booking.tracking.estimatedArrivalMins = 0;
    booking.tracking.distanceKm = 0;
    await notify({
      user: booking.customer._id,
      type: 'professional_arrived',
      title: 'Professional arrived! 📍',
      message: `${providerName} has arrived at your address for your service.`,
      link: `/customer/bookings/${booking._id}`,
    });
  } else if (status === 'in_progress') {
    await notify({
      user: booking.customer._id,
      type: 'job_in_progress',
      title: 'Service in progress ⚙️',
      message: `${providerName} has begun work on your service.`,
      link: `/customer/bookings/${booking._id}`,
    });
  } else if (status === 'completed') {
    const provider = await ProviderProfile.findById(booking.provider._id);
    if (provider) {
      provider.completedJobs += 1;
      await provider.save();
    }

    await ServiceRequest.findByIdAndUpdate(booking.serviceRequest, { status: 'completed' });

    // Initialize 30-Day Service Warranty
    if (!booking.warranty) booking.warranty = {};
    booking.warranty.days = 30;
    booking.warranty.status = 'active';
    booking.warranty.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

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
      title: 'Job completed & 30-Day Warranty active! 🛡️',
      message: `Your booking has been completed. Your 30-day free rework warranty is now active! Please confirm and leave a review.`,
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

  await booking.save();
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

// @route PUT /api/bookings/:id/tracking (provider updates live coordinates)
const updateTracking = asyncHandler(async (req, res) => {
  const { currentLat, currentLng, estimatedArrivalMins, distanceKm, heading } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found.');

  if (!booking.tracking) booking.tracking = {};
  if (currentLat !== undefined) booking.tracking.currentLat = currentLat;
  if (currentLng !== undefined) booking.tracking.currentLng = currentLng;
  if (estimatedArrivalMins !== undefined) booking.tracking.estimatedArrivalMins = estimatedArrivalMins;
  if (distanceKm !== undefined) booking.tracking.distanceKm = distanceKm;
  if (heading !== undefined) booking.tracking.heading = heading;
  booking.tracking.lastUpdated = new Date();

  await booking.save();
  res.json({ success: true, tracking: booking.tracking });
});

// @route POST /api/bookings/:id/warranty-claim (customer raises free/reduced warranty revisit)
const claimWarranty = asyncHandler(async (req, res) => {
  const { reason, issueType, preferredDate, note } = req.body;
  if (!reason || !reason.trim()) throw new ApiError(400, 'Please state the reason for the warranty revisit request.');

  const booking = await Booking.findById(req.params.id)
    .populate('customer', 'name')
    .populate({ path: 'provider', populate: { path: 'user', select: 'name' } })
    .populate('category', 'name');
  if (!booking) throw new ApiError(404, 'Booking not found.');

  if (String(booking.customer._id || booking.customer) !== String(req.user._id)) {
    throw new ApiError(403, 'Not authorized to claim warranty for this booking.');
  }

  if (booking.status !== 'completed') {
    throw new ApiError(400, 'Warranty claims are only available for completed jobs.');
  }

  // Determine warranty coverage
  const now = new Date();
  const expiresAt = booking.warranty?.expiresAt || new Date(new Date(booking.updatedAt).getTime() + 30 * 24 * 60 * 60 * 1000);
  const isFree = now <= expiresAt;
  const costType = isFree ? 'free' : 'reduced';

  const claim = {
    reason: reason.trim(),
    issueType: issueType || 'revisit',
    costType,
    preferredDate: preferredDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    note: note || '',
    status: 'requested',
    createdAt: new Date(),
  };

  if (!booking.warranty) booking.warranty = { days: 30, status: 'active', claims: [] };
  booking.warranty.status = 'claimed';
  booking.warranty.claims.push(claim);
  await booking.save();

  // Notify Provider
  await notify({
    user: booking.provider.user._id || booking.provider.user,
    type: 'warranty_claimed',
    title: `${isFree ? 'Free' : 'Reduced-Cost'} Warranty Revisit Requested`,
    message: `Customer ${booking.customer.name} requested a warranty revisit for "${booking.category?.name || 'Service'}". Reason: ${reason}`,
    link: `/provider/jobs/${booking._id}`,
  });

  // Notify Customer
  await notify({
    user: booking.customer._id,
    type: 'warranty_claimed',
    title: 'Warranty Claim Submitted! 🛡️',
    message: `Your ${isFree ? '100% Free' : 'Reduced Cost'} warranty revisit request has been received. Our provider will coordinate with you.`,
    link: `/customer/bookings/${booking._id}`,
  });

  await audit({ actor: req.user, action: 'WARRANTY_CLAIMED', entityType: 'Booking', entityId: booking._id, details: { costType, reason } });

  res.status(201).json({ success: true, data: booking, claim });
});

// @route POST /api/bookings/:id/masked-call (initiate private number call session)
const initiateMaskedCall = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('customer', 'name phone')
    .populate({ path: 'provider', populate: { path: 'user', select: 'name phone' } });
  if (!booking) throw new ApiError(404, 'Booking not found.');

  const isCustomer = String(booking.customer._id || booking.customer) === String(req.user._id);
  const isProvider = String(booking.provider?.user?._id || booking.provider?.user) === String(req.user._id);
  const isStaff = ['admin', 'operations_manager', 'support_agent'].includes(req.user.role);
  if (!isCustomer && !isProvider && !isStaff) throw new ApiError(403, 'Not authorized.');

  const targetUser = isCustomer ? booking.provider.user : booking.customer;
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const roomId = `careconnect-call-${booking._id.toString().slice(-6)}-${Date.now().toString(36)}`;
  const virtualNumber = '+91 1800-CARE-829 (Toll-Free Relay)';

  booking.maskedCall = {
    virtualNumber,
    accessCode: pin,
    activeRoomId: roomId,
  };
  await booking.save();

  // Notify recipient
  await notify({
    user: targetUser._id,
    type: 'masked_call',
    title: `📞 Incoming Masked Call from ${req.user.name}`,
    message: `${req.user.name} is calling you via CareConnect's secure private relay. Personal numbers are fully protected.`,
    link: isCustomer ? `/provider/jobs/${booking._id}` : `/customer/bookings/${booking._id}`,
  });

  res.json({
    success: true,
    data: {
      virtualNumber,
      accessPin: pin,
      roomId,
      callerName: req.user.name,
      recipientName: targetUser.name,
      targetRole: isCustomer ? 'Provider' : 'Customer',
      expiresIn: '2 hours',
    },
  });
});

// @route POST /api/bookings/:id/repeat (One-click rebook same pro & service)
const repeatBooking = asyncHandler(async (req, res) => {
  const { scheduledDate, preferredTimeWindow, rawDescription, note } = req.body;
  const booking = await Booking.findById(req.params.id)
    .populate('customer')
    .populate({ path: 'provider', populate: { path: 'user', select: 'name' } })
    .populate('category');
  if (!booking) throw new ApiError(404, 'Booking not found.');

  if (String(booking.customer._id || booking.customer) !== String(req.user._id)) {
    throw new ApiError(403, 'Not authorized.');
  }

  // Create new service request with pre-selected provider and category
  const providerName = booking.provider?.user?.name || 'Your previous professional';
  const newRequest = await ServiceRequest.create({
    customer: req.user._id,
    rawDescription: rawDescription || note || `Repeat booking with ${providerName} for ${booking.category?.name || 'home service'}`,
    category: booking.category?._id,
    aiSuggestedCategory: booking.category?._id,
    aiConfidence: 1.0,
    preferredProvider: booking.provider._id,
    isRepeatBooking: true,
    originalBooking: booking._id,
    location: req.user.address || booking.customer.address,
    preferredDate: scheduledDate ? new Date(scheduledDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
    preferredTimeWindow: preferredTimeWindow || (booking.scheduledStartTime ? `${booking.scheduledStartTime}–${booking.scheduledEndTime}` : 'Morning (9am-12pm)'),
    urgency: 'normal',
    status: 'submitted',
  });

  // Notify preferred provider of direct repeat booking request
  await notify({
    user: booking.provider.user._id || booking.provider.user,
    type: 'repeat_booking',
    title: 'Repeat Customer Booking Request! ⭐',
    message: `${req.user.name} requested to book you again for "${booking.category?.name}". Click to view details and send a fast quote.`,
    link: `/provider/requests/${newRequest._id}`,
  });

  await notify({
    user: req.user._id,
    type: 'system',
    title: 'Repeat Booking Created! 🚀',
    message: `Your repeat request for ${booking.category?.name} with ${providerName} has been submitted.`,
    link: `/customer/requests/${newRequest._id}`,
  });

  await audit({ actor: req.user, action: 'BOOKING_REPEAT_CREATED', entityType: 'Booking', entityId: booking._id, details: { newRequestId: newRequest._id } });

  res.status(201).json({ success: true, data: newRequest });
});

module.exports = {
  listBookings,
  getBooking,
  updateStatus,
  confirmCompletion,
  cancelBooking,
  getBookingMessages,
  sendBookingMessage,
  updateTracking,
  claimWarranty,
  initiateMaskedCall,
  repeatBooking,
};

