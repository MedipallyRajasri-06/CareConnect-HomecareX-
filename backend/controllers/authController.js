const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { audit } = require('../services/auditService');

const PALETTE = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706', '#0891b2', '#db2777'];
const randomColor = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];

// @desc  Register a new user
// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, address } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required.');

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'An account with this email already exists.');

  // Admin/operations_manager/support_agent accounts should be provisioned by an
  // existing admin in a real deployment; for this capstone, allow self-serve
  // signup for customer & provider (the common marketplace flow), and require
  // a request code for privileged roles.
  const allowedSelfSignup = ['customer', 'provider'];
  const finalRole = allowedSelfSignup.includes(role) ? role : 'customer';

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone,
    role: finalRole,
    address,
    avatarColor: randomColor(),
    isVerified: finalRole === 'customer',
  });

  if (finalRole === 'provider') {
    await ProviderProfile.create({ user: user._id, serviceAreas: address?.city ? [address.city] : [] });
  }

  await audit({ actor: user, action: 'USER_REGISTERED', entityType: 'User', entityId: user._id });

  const token = generateToken(user);
  res.status(201).json({ success: true, token, user: user.toSafeObject() });
});

// @desc  Login
// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required.');

  const lookupEmail = email.toLowerCase();
  let user = await User.findOne({ email: lookupEmail }).select('+password');
  if (!user && lookupEmail.endsWith('@homecarex.dev')) {
    user = await User.findOne({ email: lookupEmail.replace('@homecarex.dev', '@careconnect.dev') }).select('+password');
  }
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated.');

  const token = generateToken(user);
  res.json({ success: true, token, user: user.toSafeObject() });
});

// @desc  Get current user
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

// @desc  Update own profile
// @route PUT /api/auth/me
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;
  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = { ...user.address?.toObject?.(), ...address };
  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
});

// @desc  Change password
// @route PUT /api/auth/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'Current password is incorrect.');
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully.' });
});

// @desc  Google Sign Up & Sign In
// @route POST /api/auth/google
const googleAuth = asyncHandler(async (req, res) => {
  const { email, name, googleId, picture, role } = req.body;
  if (!email || !name) {
    throw new ApiError(400, 'Google account email and name are required.');
  }

  const lookupEmail = email.toLowerCase().trim();
  let user = await User.findOne({ email: lookupEmail });

  if (user) {
    // Existing user - log in
    if (!user.isActive) throw new ApiError(403, 'This account has been deactivated.');
    let updated = false;
    if (googleId && !user.googleId) {
      user.googleId = googleId;
      updated = true;
    }
    if (picture && !user.avatarUrl) {
      user.avatarUrl = picture;
      updated = true;
    }
    if (updated) await user.save();

    await audit({ actor: user, action: 'USER_LOGIN_GOOGLE', entityType: 'User', entityId: user._id });
    const token = generateToken(user);
    return res.json({ success: true, token, user: user.toSafeObject() });
  }

  // New user - sign up with Google
  const allowedSelfSignup = ['customer', 'provider'];
  const finalRole = allowedSelfSignup.includes(role) ? role : 'customer';

  // Generate random 24-char password for schema safety
  const randomPass = require('crypto').randomBytes(16).toString('hex') + 'A1!';

  user = await User.create({
    name: name.trim(),
    email: lookupEmail,
    password: randomPass,
    googleId: googleId || `google_${Date.now()}`,
    authProvider: 'google',
    avatarUrl: picture,
    role: finalRole,
    avatarColor: randomColor(),
    isVerified: finalRole === 'customer',
  });

  if (finalRole === 'provider') {
    await ProviderProfile.create({ user: user._id, serviceAreas: [] });
  }

  await audit({ actor: user, action: 'USER_REGISTERED_GOOGLE', entityType: 'User', entityId: user._id });

  const token = generateToken(user);
  res.status(201).json({ success: true, token, user: user.toSafeObject() });
});

module.exports = { register, login, googleAuth, getMe, updateMe, changePassword };
