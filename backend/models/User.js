const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['admin', 'operations_manager', 'provider', 'customer', 'support_agent'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    role: { type: String, enum: ROLES, default: 'customer', required: true },
    avatarColor: { type: String, default: '#2563eb' },
    avatarUrl: { type: String },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false }, // relevant for providers
    address: {
      line1: String,
      city: String,
      state: String,
      zip: String,
      lat: Number,
      lng: Number,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
