const Quote = require('../models/Quote');
const ServiceRequest = require('../models/ServiceRequest');
const ProviderProfile = require('../models/ProviderProfile');
const Booking = require('../models/Booking');
const Message = require('../models/Message');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { hasConflict } = require('../utils/availability');
const { notify } = require('../services/notificationService');
const { audit } = require('../services/auditService');

// @route POST /api/requests/:requestId/quotes  (provider submits a quote)
const createQuote = asyncHandler(async (req, res) => {
  const { price, estimatedDuration, message, availableSlots } = req.body;
  if (!price || price <= 0) throw new ApiError(400, 'A valid price is required.');

  const request = await ServiceRequest.findById(req.params.requestId).populate('customer', 'name');
  if (!request) throw new ApiError(404, 'Service request not found.');
  if (!['classified', 'matching', 'quoted', 'awaiting_selection'].includes(request.status)) {
    throw new ApiError(400, `Cannot quote a request in status "${request.status}".`);
  }

  const profile = await ProviderProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Provider profile not found.');
  if (profile.verificationStatus !== 'verified') {
    throw new ApiError(403, 'Only verified providers can submit quotes.');
  }

  const existing = await Quote.findOne({ serviceRequest: request._id, provider: profile._id });
  if (existing) throw new ApiError(409, 'You already submitted a quote for this request.');

  const quote = await Quote.create({
    serviceRequest: request._id,
    provider: profile._id,
    price,
    estimatedDuration,
    message,
    availableSlots: availableSlots || [],
  });

  if (['classified', 'matching'].includes(request.status)) {
    request.status = 'quoted';
    await request.save();
  }

  const providerName = req.user.name || profile.businessName || 'Provider';
  const quoteNotificationMessage = message && message.trim()
    ? `Quote ₹${price} from ${providerName}: "${message.trim()}"`
    : `You received a ₹${price} quote for your service request from ${providerName}.`;

  await notify({
    user: request.customer._id,
    type: 'new_quote',
    title: 'New quote received',
    message: quoteNotificationMessage,
    link: `/customer/requests/${request._id}`,
  });

  res.status(201).json({ success: true, data: quote });
});

// @route GET /api/requests/:requestId/quotes
const listQuotesForRequest = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.requestId);
  if (!request) throw new ApiError(404, 'Request not found.');

  const isOwner = String(request.customer) === String(req.user._id);
  const isStaff = ['admin', 'operations_manager'].includes(req.user.role);
  const profile = req.user.role === 'provider' ? await ProviderProfile.findOne({ user: req.user._id }) : null;

  const filter = { serviceRequest: request._id };
  // Providers only see their own quote unless staff/owner
  if (!isOwner && !isStaff) {
    if (!profile) throw new ApiError(403, 'Not authorized.');
    filter.provider = profile._id;
  }

  const quotes = await Quote.find(filter)
    .populate({ path: 'provider', populate: { path: 'user', select: 'name avatarColor' } })
    .sort({ price: 1 });

  res.json({ success: true, data: quotes });
});

// @route GET /api/quotes/mine  (provider's own submitted quotes)
const myQuotes = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  if (!profile) return res.json({ success: true, data: [] });

  const quotes = await Quote.find({ provider: profile._id })
    .populate('serviceRequest')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: quotes });
});

// @route PUT /api/quotes/:id/accept  (customer accepts -> creates booking)
const acceptQuote = asyncHandler(async (req, res) => {
  const { scheduledDate, scheduledStartTime, scheduledEndTime, slotId } = req.body;
  const quote = await Quote.findById(req.params.id).populate('serviceRequest').populate('provider');
  if (!quote) throw new ApiError(404, 'Quote not found.');

  const request = quote.serviceRequest;
  if (String(request.customer) !== String(req.user._id)) throw new ApiError(403, 'Not authorized.');
  if (quote.status !== 'pending') throw new ApiError(400, 'This quote is no longer pending.');
  if (!scheduledDate || !scheduledStartTime || !scheduledEndTime) {
    throw new ApiError(400, 'scheduledDate, scheduledStartTime and scheduledEndTime are required.');
  }

  const providerProfile = await ProviderProfile.findById(quote.provider._id);

  // Availability engine check - prevent double-booking
  if (hasConflict(providerProfile.availability, scheduledDate, scheduledStartTime, scheduledEndTime)) {
    throw new ApiError(409, 'This time slot conflicts with an existing booking for the provider.');
  }

  // Mark or create the slot as booked
  let slot = slotId ? providerProfile.availability.id(slotId) : null;
  if (!slot) {
    providerProfile.availability.push({
      date: scheduledDate,
      startTime: scheduledStartTime,
      endTime: scheduledEndTime,
      isBooked: true,
    });
    slot = providerProfile.availability[providerProfile.availability.length - 1];
  } else {
    slot.isBooked = true;
  }

  const booking = await Booking.create({
    serviceRequest: request._id,
    quote: quote._id,
    customer: req.user._id,
    provider: providerProfile._id,
    category: request.category,
    scheduledDate,
    scheduledStartTime,
    scheduledEndTime,
    slotId: slot._id,
    price: quote.price,
    updates: [{ status: 'scheduled', note: 'Booking confirmed by customer.', updatedBy: req.user._id }],
  });

  slot.bookingId = booking._id;
  await providerProfile.save();

  quote.status = 'accepted';
  await quote.save();

  // Decline all other pending quotes for this request
  await Quote.updateMany(
    { serviceRequest: request._id, _id: { $ne: quote._id }, status: 'pending' },
    { status: 'declined' }
  );

  request.status = 'scheduled';
  await request.save();

  // If provider had attached a message to the quote, seed it into the chat thread
  if (quote.message && quote.message.trim()) {
    await Message.create({
      booking: booking._id,
      sender: providerProfile.user,
      senderRole: 'provider',
      text: quote.message.trim(),
    });
  }

  await notify({
    user: providerProfile.user,
    type: 'quote_accepted',
    title: 'Your quote was accepted!',
    message: `Your quote of ₹${quote.price} was accepted. Job scheduled for ${new Date(scheduledDate).toDateString()}. Chat is now active with the customer.`,
    link: `/provider/jobs/${booking._id}`,
  });

  await notify({
    user: req.user._id,
    type: 'booking_scheduled',
    title: 'Booking confirmed!',
    message: `Your booking for ₹${quote.price} is confirmed. You can now chat directly with your provider.`,
    link: `/customer/bookings/${booking._id}`,
  });

  await audit({ actor: req.user, action: 'QUOTE_ACCEPTED', entityType: 'Booking', entityId: booking._id });

  res.status(201).json({ success: true, data: booking });
});

// @route PUT /api/quotes/:id/decline
const declineQuote = asyncHandler(async (req, res) => {
  const quote = await Quote.findById(req.params.id).populate('serviceRequest');
  if (!quote) throw new ApiError(404, 'Quote not found.');
  if (String(quote.serviceRequest.customer) !== String(req.user._id)) throw new ApiError(403, 'Not authorized.');

  quote.status = 'declined';
  await quote.save();
  res.json({ success: true, data: quote });
});

// @route PUT /api/quotes/:id/withdraw  (provider withdraws own quote)
const withdrawQuote = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  const quote = await Quote.findById(req.params.id);
  if (!quote) throw new ApiError(404, 'Quote not found.');
  if (String(quote.provider) !== String(profile?._id)) throw new ApiError(403, 'Not authorized.');
  if (quote.status !== 'pending') throw new ApiError(400, 'Only pending quotes can be withdrawn.');

  quote.status = 'withdrawn';
  await quote.save();
  res.json({ success: true, data: quote });
});

module.exports = { createQuote, listQuotesForRequest, myQuotes, acceptQuote, declineQuote, withdrawQuote };
