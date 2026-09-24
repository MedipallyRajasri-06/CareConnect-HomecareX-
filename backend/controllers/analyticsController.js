const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Dispute = require('../models/Dispute');
const ProviderProfile = require('../models/ProviderProfile');
const ServiceCategory = require('../models/ServiceCategory');
const asyncHandler = require('../utils/asyncHandler');

// @route GET /api/analytics/overview  (admin / operations_manager dashboard)
const overview = asyncHandler(async (req, res) => {
  const [
    totalCustomers,
    totalProviders,
    verifiedProviders,
    totalRequests,
    activeRequests,
    totalBookings,
    completedBookings,
    openDisputes,
    revenueAgg,
    categories,
    requestsByStatus,
    bookingsByCategory,
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'provider' }),
    ProviderProfile.countDocuments({ verificationStatus: 'verified' }),
    ServiceRequest.countDocuments(),
    ServiceRequest.countDocuments({ status: { $nin: ['completed', 'cancelled'] } }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'completed' }),
    Dispute.countDocuments({ status: { $in: ['open', 'investigating'] } }),
    Invoice.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    ServiceCategory.countDocuments({ isActive: true }),
    ServiceRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, revenue: { $sum: '$price' } } },
      { $lookup: { from: 'servicecategories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $project: { count: 1, revenue: 1, name: '$category.name' } },
      { $sort: { count: -1 } },
    ]),
  ]);

  // last 14 days trend of requests
  const since = new Date();
  since.setDate(since.getDate() - 14);
  const trend = await ServiceRequest.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      totals: {
        customers: totalCustomers,
        providers: totalProviders,
        verifiedProviders,
        categories,
        requests: totalRequests,
        activeRequests,
        bookings: totalBookings,
        completedBookings,
        openDisputes,
        revenue: revenueAgg[0]?.total || 0,
      },
      requestsByStatus,
      bookingsByCategory,
      trend,
    },
  });
});

// @route GET /api/analytics/provider  (a provider's own performance)
const providerAnalytics = asyncHandler(async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id });
  if (!profile) return res.json({ success: true, data: null });

  const [totalBookings, completed, cancelled, revenueAgg] = await Promise.all([
    Booking.countDocuments({ provider: profile._id }),
    Booking.countDocuments({ provider: profile._id, status: 'completed' }),
    Booking.countDocuments({ provider: profile._id, status: 'cancelled' }),
    Booking.aggregate([
      { $match: { provider: profile._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totalBookings,
      completed,
      cancelled,
      earnings: revenueAgg[0]?.total || 0,
      rating: profile.ratingAverage,
      ratingCount: profile.ratingCount,
    },
  });
});

module.exports = { overview, providerAnalytics };
