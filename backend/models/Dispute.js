const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const disputeSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    category: {
      type: String,
      enum: ['quality', 'no_show', 'pricing', 'damage', 'behavior', 'other'],
      default: 'other',
    },
    status: { type: String, enum: ['open', 'investigating', 'resolved', 'rejected'], default: 'open' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // support agent
    resolution: { type: String, default: '' },
    resolutionAction: {
      type: String,
      enum: ['none', 'refund', 'partial_refund', 'reschedule', 'warning_issued', 'provider_suspended'],
      default: 'none',
    },
    thread: [messageSchema],
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dispute', disputeSchema);
