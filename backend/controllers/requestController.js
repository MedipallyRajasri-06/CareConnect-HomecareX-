const ServiceRequest = require('../models/ServiceRequest');
const ServiceCategory = require('../models/ServiceCategory');
const ProviderProfile = require('../models/ProviderProfile');
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

  // 2. Fallback: if no verified candidates match category/skills, restrict fallback strictly to verified & online providers
  if (candidates.length === 0) {
    pool = await ProviderProfile.find({
      verificationStatus: 'verified',
      isOnline: true,
    })
      .populate('user', 'name avatarColor')
      .limit(25);

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

module.exports = { createRequest, listRequests, getRequest, updateCategory, matchProviders, cancelRequest };
