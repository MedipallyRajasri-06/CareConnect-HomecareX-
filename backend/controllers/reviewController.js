const mongoose = require('mongoose');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const ProviderProfile = require('../models/ProviderProfile');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { notify } = require('../services/notificationService');

// @route POST /api/bookings/:bookingId/review
const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) throw new ApiError(400, 'Rating must be between 1 and 5.');

  const booking = await Booking.findById(req.params.bookingId).populate('provider');
  if (!booking) throw new ApiError(404, 'Booking not found.');
  if (String(booking.customer) !== String(req.user._id)) throw new ApiError(403, 'Not authorized.');
  if (booking.status !== 'completed') throw new ApiError(400, 'You can only review completed jobs.');

  const existing = await Review.findOne({ booking: booking._id });
  if (existing) throw new ApiError(409, 'You already reviewed this booking.');

  const review = await Review.create({
    booking: booking._id,
    customer: req.user._id,
    provider: booking.provider._id,
    rating,
    comment,
  });

  const profile = await ProviderProfile.findById(booking.provider._id);
  const newCount = (profile.ratingCount || 0) + 1;
  const newAvg = ((profile.ratingAverage || 0) * (profile.ratingCount || 0) + rating) / newCount;
  profile.ratingCount = newCount;
  profile.ratingAverage = Math.round(newAvg * 100) / 100;
  await profile.save();

  await notify({
    user: profile.user,
    type: 'review_received',
    title: 'New review received',
    message: `You received a ${rating}-star review!`,
    link: `/provider/reviews`,
  });

  res.status(201).json({ success: true, data: review });
});

// @route GET /api/providers/:providerId/reviews
const listReviewsForProvider = asyncHandler(async (req, res) => {
  let providerId = req.params.providerId;
  if (providerId === 'me') {
    const profile = await ProviderProfile.findOne({ user: req.user._id });
    if (!profile) return res.json({ success: true, data: [] });
    providerId = profile._id;
  } else if (!mongoose.Types.ObjectId.isValid(providerId)) {
    return res.json({ success: true, data: [] });
  }
  const reviews = await Review.find({ provider: providerId })
    .populate('customer', 'name avatarColor')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
});

// @route PUT /api/reviews/:id/respond  (provider responds to a review)
const respondToReview = asyncHandler(async (req, res) => {
  const { response } = req.body;
  const review = await Review.findById(req.params.id).populate('provider');
  if (!review) throw new ApiError(404, 'Review not found.');

  const profile = await ProviderProfile.findOne({ user: req.user._id });
  if (!profile || String(review.provider._id) !== String(profile._id)) throw new ApiError(403, 'Not authorized.');

  review.providerResponse = response;
  await review.save();
  res.json({ success: true, data: review });
});

module.exports = { createReview, listReviewsForProvider, respondToReview };
