const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rawDescription: { type: String, required: true }, // free-text from customer
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory' }, // AI-classified or chosen
    aiSuggestedCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCategory' },
    aiConfidence: { type: Number, default: 0 }, // 0-1
    aiRequiredSkills: [{ type: String, lowercase: true, trim: true }],
    urgency: { type: String, enum: ['low', 'normal', 'high', 'emergency'], default: 'normal' },
    location: {
      line1: String,
      city: String,
      state: String,
      zip: String,
      lat: Number,
      lng: Number,
    },
    preferredDate: { type: Date },
    preferredTimeWindow: { type: String }, // "morning" | "09:00-12:00" free text
    budgetMax: { type: Number },
    photos: [{ type: String }], // urls
    status: {
      type: String,
      enum: [
        'submitted',
        'classified',
        'matching',
        'quoted',
        'awaiting_selection',
        'scheduled',
        'in_progress',
        'completed',
        'cancelled',
        'disputed',
      ],
      default: 'submitted',
    },
    aiRankedProviders: [
      {
        provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderProfile' },
        score: Number,
        reasons: [String],
        ratingAverage: Number,
        completedJobs: Number,
        experienceYears: Number,
      },
    ],
    matchingUsedFallback: { type: Boolean, default: false },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
