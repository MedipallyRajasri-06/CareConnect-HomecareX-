const mongoose = require('mongoose');

const jobUpdateSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    attachments: [{ type: String }], // photo urls (before/after evidence)
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    serviceRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    quote: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderProfile', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory' },
    scheduledDate: { type: Date, required: true },
    scheduledStartTime: { type: String, required: true },
    scheduledEndTime: { type: String, required: true },
    slotId: { type: mongoose.Schema.Types.ObjectId }, // links back to provider's availability slot
    price: { type: Number, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'on_the_way', 'arrived', 'in_progress', 'completed', 'cancelled', 'disputed'],
      default: 'scheduled',
    },
    tracking: {
      status: {
        type: String,
        enum: ['assigned', 'on_the_way', 'arrived', 'in_progress', 'completed'],
        default: 'assigned',
      },
      currentLat: { type: Number, default: 12.9716 },
      currentLng: { type: Number, default: 77.5946 },
      destinationLat: { type: Number, default: 12.9820 },
      destinationLng: { type: Number, default: 77.6050 },
      estimatedArrivalMins: { type: Number, default: 15 },
      distanceKm: { type: Number, default: 3.4 },
      heading: { type: Number, default: 45 },
      lastUpdated: { type: Date, default: Date.now },
      vehicleType: { type: String, default: 'Service Van' },
    },
    warranty: {
      days: { type: Number, default: 30 },
      expiresAt: { type: Date },
      status: { type: String, enum: ['active', 'claimed', 'expired'], default: 'active' },
      claims: [
        {
          reason: { type: String, required: true },
          issueType: { type: String, default: 'revisit' },
          costType: { type: String, enum: ['free', 'reduced'], default: 'free' },
          preferredDate: { type: Date },
          note: { type: String, default: '' },
          status: { type: String, enum: ['requested', 'approved', 'scheduled', 'resolved'], default: 'requested' },
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
    maskedCall: {
      virtualNumber: { type: String, default: '+91 (800) 427-3266' },
      accessCode: { type: String, default: '4082' },
      activeRoomId: { type: String },
    },
    updates: [jobUpdateSchema],
    customerConfirmedAt: { type: Date },
    cancellationReason: { type: String },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
