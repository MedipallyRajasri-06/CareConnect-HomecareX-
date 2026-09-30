const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'request_classified',
        'new_quote',
        'quote_accepted',
        'booking_scheduled',
        'professional_on_the_way',
        'professional_arrived',
        'job_in_progress',
        'job_update',
        'job_completed',
        'payment_completed',
        'warranty_claimed',
        'warranty_updated',
        'repeat_booking',
        'masked_call',
        'review_received',
        'dispute_opened',
        'dispute_resolved',
        'provider_verified',
        'provider_rejected',
        'chat_message',
        'system',
      ],
      default: 'system',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' }, // frontend route to deep-link to
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
