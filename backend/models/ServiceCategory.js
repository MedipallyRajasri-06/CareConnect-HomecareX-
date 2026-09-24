const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'wrench' }, // lucide icon name
    keywords: [{ type: String, lowercase: true, trim: true }], // used by AI classifier
    requiredSkills: [{ type: String, trim: true }],
    basePrice: { type: Number, required: true, default: 0 },
    pricingUnit: { type: String, enum: ['flat', 'hourly'], default: 'flat' },
    surgeMultiplier: { type: Number, default: 1 }, // pricing policy control by admin
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);
