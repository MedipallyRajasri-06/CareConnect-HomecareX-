const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sun..6=Sat, recurring weekly template
    date: { type: Date }, // for one-off exceptions/specific-day slots
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "12:00"
    isBooked: { type: Boolean, default: false },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  },
  { _id: true }
);

const providerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bio: { type: String, default: '' },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory' }],
    skills: [{ type: String, lowercase: true, trim: true }],
    experienceYears: { type: Number, default: 0 },
    hourlyRate: { type: Number, default: 0 },
    serviceAreas: [{ type: String, trim: true }], // city/zip codes served
    documents: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verificationNotes: { type: String, default: '' },
    availability: [availabilitySlotSchema],
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    completedJobs: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: true }, // accepting jobs toggle
  },
  { timestamps: true }
);

providerProfileSchema.index({ serviceAreas: 1 });
providerProfileSchema.index({ skills: 1 });

module.exports = mongoose.model('ProviderProfile', providerProfileSchema);
