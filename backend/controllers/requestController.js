const ServiceRequest = require('../models/ServiceRequest');
const ServiceCategory = require('../models/ServiceCategory');
const ProviderProfile = require('../models/ProviderProfile');
const Booking = require('../models/Booking');
const Quote = require('../models/Quote');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const aiService = require('../services/aiService');
const { notify } = require('../services/notificationService');
const { audit } = require('../services/auditService');

// @route POST /api/requests  (customer)
const createRequest = asyncHandler(async (req, res) => {
  const {
    rawDescription,
    location,
    preferredDate,
    preferredTimeWindow,
    budgetMax,
    urgency,
    photos,
    media,
    categoryOverride,
    preferredProvider,
    isRepeatBooking,
    originalBooking,
  } = req.body;
  if (!rawDescription || rawDescription.trim().length < 5) {
    throw new ApiError(400, 'Please describe the service you need (at least 5 characters).');
  }

  let categories = await ServiceCategory.find({ isActive: true });
  if (categories.length === 0) {
    const { ensureDefaultCategories } = require('../services/defaultCategories');
    await ensureDefaultCategories();
    categories = await ServiceCategory.find({ isActive: true });
  }
  if (categories.length === 0) throw new ApiError(500, 'No service categories configured yet.');

  // --- AI classification step ---
  const classification = aiService.classifyRequest(rawDescription, categories);

  // Normalize media (photos/videos)
  const normalizedMedia = Array.isArray(media)
    ? media.map((m) => (typeof m === 'string' ? { url: m, type: m.includes('video') || m.endsWith('.mp4') ? 'video' : 'photo' } : m))
    : [];

  const legacyPhotos = [
    ...(Array.isArray(photos) ? photos : []),
    ...normalizedMedia.map((m) => m.url),
  ].filter(Boolean);

  const request = await ServiceRequest.create({
    customer: req.user._id,
    rawDescription,
    category: categoryOverride || classification.category?._id,
    aiSuggestedCategory: classification.category?._id,
    aiConfidence: classification.confidence,
    aiRequiredSkills: classification.requiredSkills,
    urgency: urgency || 'normal',
    location,
    preferredDate,
    preferredTimeWindow,
    budgetMax,
    photos: legacyPhotos,
    media: normalizedMedia,
    preferredProvider: preferredProvider || undefined,
    isRepeatBooking: Boolean(isRepeatBooking),
    originalBooking: originalBooking || undefined,
    status: 'classified',
  });

  await audit({ actor: req.user, action: 'REQUEST_CREATED', entityType: 'ServiceRequest', entityId: request._id, details: { aiConfidence: classification.confidence } });

  res.status(201).json({
    success: true,
    data: request,
    ai: { suggestedCategory: classification.category, confidence: classification.confidence, alternatives: classification.allScores },
  });
});

// @route GET /api/requests  (role-aware listing)
const listRequests = asyncHandler(async (req, res) => {
  const { status, category, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;

  if (req.user.role === 'customer') filter.customer = req.user._id;
  // providers see requests matched to them via aiRankedProviders
  if (req.user.role === 'provider') {
    const profile = await ProviderProfile.findOne({ user: req.user._id });
    if (profile) filter['aiRankedProviders.provider'] = profile._id;
    else return res.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0 } });
  }
  // admin, operations_manager, support_agent see all (filter optional)

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    ServiceRequest.find(filter)
      .populate('customer', 'name email phone avatarColor')
      .populate('category', 'name icon basePrice pricingUnit')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    ServiceRequest.countDocuments(filter),
  ]);

  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total } });
});

// @route GET /api/requests/:id
const getRequest = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id)
    .populate('customer', 'name email phone avatarColor')
    .populate('category', 'name icon basePrice pricingUnit requiredSkills')
    .populate('aiSuggestedCategory', 'name icon')
    .populate({ path: 'aiRankedProviders.provider', populate: { path: 'user', select: 'name avatarColor phone email' } })
    .populate({ path: 'preferredProvider', populate: { path: 'user', select: 'name avatarColor phone email' } })
    .populate('originalBooking');
  if (!request) throw new ApiError(404, 'Service request not found.');

  const isOwner = String(request.customer._id) === String(req.user._id);
  const isStaff = ['admin', 'operations_manager', 'support_agent'].includes(req.user.role);
  if (!isOwner && !isStaff && req.user.role !== 'provider') throw new ApiError(403, 'Not authorized to view this request.');

  // Filter out any stale/deleted providers so only real existing registered providers appear
  if (request.aiRankedProviders && request.aiRankedProviders.length > 0) {
    const validMatches = request.aiRankedProviders.filter((rp) => rp.provider && rp.provider.user);
    if (validMatches.length !== request.aiRankedProviders.length) {
      request.aiRankedProviders = validMatches;
      await ServiceRequest.updateOne({ _id: request._id }, { aiRankedProviders: validMatches });
    }
  }

  res.json({ success: true, data: request });
});

// @route PUT /api/requests/:id/category  (customer or ops can correct AI classification)
const updateCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.body;
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Request not found.');

  const isOwner = String(request.customer) === String(req.user._id);
  const isStaff = ['admin', 'operations_manager'].includes(req.user.role);
  if (!isOwner && !isStaff) throw new ApiError(403, 'Not authorized.');

  const category = await ServiceCategory.findById(categoryId);
  if (!category) throw new ApiError(404, 'Category not found.');

  request.category = category._id;
  await request.save();
  res.json({ success: true, data: request });
});

// @route POST /api/requests/:id/match  (trigger AI provider matching)
const matchProviders = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id).populate('category');
  if (!request) throw new ApiError(404, 'Request not found.');

  const isOwner = String(request.customer) === String(req.user._id);
  const isStaff = ['admin', 'operations_manager'].includes(req.user.role);
  if (!isOwner && !isStaff) throw new ApiError(403, 'Not authorized.');

  // Extract skill tokens from aiRequiredSkills and customer description
  const reqSkills = (request.aiRequiredSkills || []).map((s) => s.toLowerCase());
  const descTokens = aiService.tokenize ? aiService.tokenize(request.rawDescription || '') : [];
  const skillKeywords = Array.from(new Set([...reqSkills, ...descTokens.filter((t) => t.length > 3)]));

  const orConditions = [];
  if (request.category?._id) {
    orConditions.push({ categories: request.category._id });
  }
  if (skillKeywords.length > 0) {
    orConditions.push({ skills: { $in: skillKeywords } });
  }

  // 1. Query verified and online candidates matching category OR skills
  const candidateFilter = {
    verificationStatus: 'verified',
    isOnline: true,
  };
  if (orConditions.length > 0) {
    candidateFilter.$or = orConditions;
  }

  const candidates = await ProviderProfile.find(candidateFilter).populate('user', 'name avatarColor');

  let pool = candidates;
  let usedFallback = false;

  // 2. Fallback: if no verified candidates match category/skills, broaden search to all available verified providers
  if (candidates.length === 0) {
    pool = await ProviderProfile.find({
      verificationStatus: 'verified',
      isOnline: true,
    })
      .populate('user', 'name avatarColor')
      .limit(25);

    if (pool.length === 0) {
      pool = await ProviderProfile.find({
        verificationStatus: 'verified',
      })
        .populate('user', 'name avatarColor')
        .limit(25);
    }

    if (pool.length === 0) {
      pool = await ProviderProfile.find({})
        .populate('user', 'name avatarColor')
        .limit(25);
    }

    pool = pool.filter((p) => p && p.user);

    if (pool.length > 0) {
      usedFallback = true;
    }
  }

  // Check if any matching providers are registered but pending admin verification
  let pendingMatchingCount = 0;
  if (orConditions.length > 0) {
    pendingMatchingCount = await ProviderProfile.countDocuments({
      verificationStatus: 'pending',
      $or: orConditions,
    });
  }

  const ranked = pool.length > 0 ? aiService.rankProviders(request, pool) : [];
  const top = ranked.slice(0, 8);

  request.aiRankedProviders = top;
  request.matchingUsedFallback = usedFallback;
  request.status = 'matching';
  await request.save();

  // Notify top matched providers
  await Promise.all(
    top.slice(0, 5).map((r) => {
      const cand = pool.find((c) => String(c._id) === String(r.provider));
      if (!cand?.user?._id) return null;
      return notify({
        user: cand.user._id,
        type: 'request_classified',
        title: 'New job match!',
        message: `A new "${request.category?.name || 'service'}" request matches your profile (score ${r.score}/100).`,
        link: `/provider/requests/${request._id}`,
      });
    })
  );

  const populated = await ServiceRequest.findById(request._id)
    .populate('customer', 'name email phone avatarColor')
    .populate('category', 'name icon basePrice pricingUnit requiredSkills')
    .populate('aiSuggestedCategory', 'name icon')
    .populate({ path: 'aiRankedProviders.provider', populate: { path: 'user', select: 'name avatarColor phone email' } })
    .populate({ path: 'preferredProvider', populate: { path: 'user', select: 'name avatarColor phone email' } });

  res.json({
    success: true,
    data: populated,
    usedFallback,
    pendingVerificationCount: pendingMatchingCount,
  });
});

// @route PUT /api/requests/:id/cancel
const cancelRequest = asyncHandler(async (req, res) => {
  const request = await ServiceRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Request not found.');

  const isOwner = String(request.customer) === String(req.user._id);
  const isStaff = ['admin', 'operations_manager'].includes(req.user.role);
  if (!isOwner && !isStaff) throw new ApiError(403, 'Not authorized.');

  if (['completed', 'cancelled'].includes(request.status)) {
    throw new ApiError(400, `Cannot cancel a request that is already ${request.status}.`);
  }

  request.status = 'cancelled';
  request.cancellationReason = req.body.reason || 'Cancelled by user';
  await request.save();
  res.json({ success: true, data: request });
});

// @route POST /api/requests/:id/book-provider or POST /api/bookings/direct
const directBookProvider = asyncHandler(async (req, res) => {
  const { providerId, requestId, serviceRequestId, scheduledDate, scheduledStartTime, scheduledEndTime, price: customPrice, notes } = req.body;
  if (!providerId) throw new ApiError(400, 'Provider ID is required.');

  const targetRequestId = (req.params.id && req.params.id !== 'direct' && req.params.id !== 'book-provider')
    ? req.params.id
    : (requestId || serviceRequestId);

  if (!targetRequestId) throw new ApiError(400, 'Service request ID is required.');

  const request = await ServiceRequest.findById(targetRequestId).populate('category');
  if (!request) throw new ApiError(404, 'Service request not found.');

  const isOwner = String(request.customer) === String(req.user._id);
  const isStaff = ['admin', 'operations_manager'].includes(req.user.role);
  if (!isOwner && !isStaff) throw new ApiError(403, 'Not authorized to book for this request.');

  // Find provider profile by profile ID or user ID
  let providerProfile = await ProviderProfile.findById(providerId).populate('user');
  if (!providerProfile) {
    providerProfile = await ProviderProfile.findOne({ user: providerId }).populate('user');
  }
  if (!providerProfile) throw new ApiError(404, 'Provider profile not found.');

  // Calculate booking price
  const price = customPrice || request.budgetMax || (request.category?.basePrice ? request.category.basePrice : 499);

  // Parse scheduling date & times
  let sDate = scheduledDate ? new Date(scheduledDate) : (request.preferredDate ? new Date(request.preferredDate) : new Date(Date.now() + 86400000));
  if (isNaN(sDate.getTime())) sDate = new Date(Date.now() + 86400000);
  const sStart = scheduledStartTime || '10:00';
  const sEnd = scheduledEndTime || '12:00';

  // Create accepted Quote record
  const quote = await Quote.create({
    serviceRequest: request._id,
    provider: providerProfile._id,
    price,
    estimatedDuration: '1-2 hours',
    message: notes || `Direct booking with ${providerProfile.user?.name || 'verified professional'}.`,
    status: 'accepted',
  });

  // Decline any other pending quotes
  await Quote.updateMany(
    { serviceRequest: request._id, _id: { $ne: quote._id }, status: 'pending' },
    { status: 'declined' }
  );

  // Add booked slot to provider availability
  providerProfile.availability.push({
    date: sDate,
    startTime: sStart,
    endTime: sEnd,
    isBooked: true,
  });
  const slot = providerProfile.availability[providerProfile.availability.length - 1];

  // Create confirmed Booking
  const booking = await Booking.create({
    serviceRequest: request._id,
    quote: quote._id,
    customer: req.user._id,
    provider: providerProfile._id,
    category: request.category?._id || request.category,
    scheduledDate: sDate,
    scheduledStartTime: sStart,
    scheduledEndTime: sEnd,
    slotId: slot._id,
    price,
    status: 'scheduled',
    tracking: {
      status: 'assigned',
      currentLat: 17.3850,
      currentLng: 78.4867,
      destinationLat: 17.3457,
      destinationLng: 78.5522,
      distanceKm: 3.5,
      estimatedArrivalMins: 20,
      vehicleType: 'Service Van',
    },
    warranty: {
      days: 30,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active',
      claims: [],
    },
    updates: [{ status: 'scheduled', note: 'Direct booking confirmed by customer.', updatedBy: req.user._id }],
  });

  slot.bookingId = booking._id;
  await providerProfile.save();

  // Update request state
  request.status = 'scheduled';
  request.preferredProvider = providerProfile._id;
  await request.save();

  // Notify provider
  await notify({
    user: providerProfile.user._id,
    type: 'booking_created',
    title: 'New Service Booking!',
    message: `You were directly booked by ${req.user.name} for ${request.category?.name || 'Home Service'}!`,
    link: `/provider/bookings/${booking._id}`,
  });

  // Notify customer
  await notify({
    user: req.user._id,
    type: 'booking_created',
    title: 'Booking Confirmed!',
    message: `Your booking with ${providerProfile.user?.name} is confirmed for ${sDate.toLocaleDateString()}.`,
    link: `/customer/bookings/${booking._id}`,
  });

  await audit({ actor: req.user, action: 'DIRECT_BOOKING_CREATED', entityType: 'Booking', entityId: booking._id, details: { provider: providerProfile._id, price } });

  res.status(201).json({
    success: true,
    data: booking,
    message: 'Service booked successfully with selected provider.',
  });
});

module.exports = { createRequest, listRequests, getRequest, updateCategory, matchProviders, cancelRequest, directBookProvider };
