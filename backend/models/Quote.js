const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema(
  {
    serviceRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ProviderProfile', required: true },
    price: { type: Number, required: true },
    estimatedDuration: { type: String }, // "2 hours"
    availableSlots: [
      {
        date: Date,
        startTime: String,
        endTime: String,
      },
    ],
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired', 'withdrawn'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

quoteSchema.index({ serviceRequest: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('Quote', quoteSchema);
