const ProviderProfile = require('../models/ProviderProfile');
const Booking = require('../models/Booking');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { hasConflict } = require('../utils/availability');
const { notify } = require('../services/notificationService');
const { audit } = require('../services/auditService');

// @route GET /api/providers  (search/browse, public-ish for logged-in users)
const listProviders = asyncHandler(async (req, res) => {
  const { category, skill, area, verified, online, q, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (category) filter.categories = category;
  if (skill) filter.skills = skill.toLowerCase();
  if (area) filter.serviceAreas = { $regex: area, $options: 'i' };
  if (verified) filter.verificationStatus = verified;
  if (online) filter.isOnline = online === 'true';

  let query = ProviderProfile.find(filter)
    .populate('user', 'name email phone avatarColor isActive')
    .populate('categories', 'name icon');

  if (q) {
    query = ProviderProfile.find({
      ...filter,
      $or: [{ skills: { $regex: q, $options: 'i' } }, { bio: { $regex: q, $options: 'i' } }],
    })
      .populate('user', 'name email phone avatarColor isActive')
      .populate('categories', 'name icon');
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    query.clone().sort({ ratingAverage: -1 }).skip(skip).limit(Number(limit)),
    ProviderProfile.countDocuments(filter),
  ]);

  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total } });
});

// @route GET /api/providers/me
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id })
    .populate('categories', 'name icon')
    .populate('user', 'name email phone avatarColor');
  if (!profile) throw new ApiError(404, 'Provider profile not found.');
  res.json({ success: true, data: profile });
});

// @route GET /api/providers/:id
const getProvider = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findById(req.params.id)
    .populate('categories', 'name icon')
    .populate('user', 'name email phone avatarColor');
  if (!profile) throw new ApiError(404, 'Provider not found.');
  res.json({ success: true, data: profile });
});

// @route PUT /api/providers/me  (provider updates own profile)
const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Provider profile not found.');

  const fields = ['bio', 'categories', 'skills', 'experienceYears', 'hourlyRate', 'serviceAreas', 'isOnline'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) profile[f] = req.body[f];
  });
  await profile.save();
  res.json({ success: true, data: profile });
});

// @route POST /api/providers/me/documents  (submit verification docs)
const addDocument = asyncHandler(async (req, res) => {
  const { name, url } = req.body;
  if (!name || !url) throw new ApiError(400, 'Document name and url are required.');
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Provider profile not found.');
  profile.documents.push({ name, url });
  if (profile.verificationStatus === 'rejected') profile.verificationStatus = 'pending';
  await profile.save();
  res.status(201).json({ success: true, data: profile });
});

// @route PUT /api/providers/:id/verify  (admin)
const verifyProvider = asyncHandler(async (req, res) => {
  const { status, notes } = req.body; // 'verified' | 'rejected' | 'pending'
  if (!['verified', 'rejected', 'pending'].includes(status)) throw new ApiError(400, 'Invalid status.');

  const profile = await ProviderProfile.findById(req.params.id).populate('user');
  if (!profile) throw new ApiError(404, 'Provider not found.');

  profile.verificationStatus = status;
  profile.verificationNotes = notes || '';
  await profile.save();

  await notify({
    user: profile.user._id,
    type: status === 'verified' ? 'provider_verified' : 'provider_rejected',
    title: status === 'verified' ? 'You are verified!' : 'Verification update',
    message:
      status === 'verified'
        ? 'Congratulations! Your provider profile has been verified. You can now receive job matches.'
        : `Your verification status is now "${status}". ${notes || ''}`,
    link: '/provider/profile',
  });

  await audit({ actor: req.user, action: 'PROVIDER_VERIFICATION_UPDATED', entityType: 'ProviderProfile', entityId: profile._id, details: { status } });

  res.json({ success: true, data: profile });
});

// ---- Availability management ----

// @route POST /api/providers/me/availability  (add slot(s))
const addAvailabilitySlots = asyncHandler(async (req, res) => {
  const { slots } = req.body; // [{date, startTime, endTime}] or [{dayOfWeek, startTime, endTime}]
  if (!Array.isArray(slots) || slots.length === 0) throw new ApiError(400, 'Provide at least one slot.');

  const profile = await ProviderProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Provider profile not found.');

  for (const s of slots) {
    if (!s.startTime || !s.endTime) throw new ApiError(400, 'Each slot needs startTime and endTime.');
    if (s.date && hasConflict(profile.availability, s.date, s.startTime, s.endTime)) {
      throw new ApiError(409, `Slot conflicts with an existing booking on ${new Date(s.date).toDateString()}.`);
    }
    profile.availability.push({
      date: s.date || undefined,
      dayOfWeek: s.dayOfWeek !== undefined ? s.dayOfWeek : undefined,
      startTime: s.startTime,
      endTime: s.endTime,
    });
  }

  await profile.save();
  res.status(201).json({ success: true, data: profile.availability });
});

// @route DELETE /api/providers/me/availability/:slotId
const removeAvailabilitySlot = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Provider profile not found.');

  const slot = profile.availability.id(req.params.slotId);
  if (!slot) throw new ApiError(404, 'Slot not found.');
  if (slot.isBooked) throw new ApiError(400, 'Cannot remove a booked slot. Cancel the booking first.');

  slot.deleteOne();
  await profile.save();
  res.json({ success: true, message: 'Slot removed.' });
});

module.exports = {
  listProviders,
  getMyProfile,
  getProvider,
  updateMyProfile,
  addDocument,
  verifyProvider,
  addAvailabilitySlots,
  removeAvailabilitySlot,
};
