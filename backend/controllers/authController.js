const User = require('../models/User');
const ProviderProfile = require('../models/ProviderProfile');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { audit } = require('../services/auditService');
const { OAuth2Client } = require('google-auth-library');

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

// @desc  Google Sign Up & Sign In (Real Google OAuth verification)
// @route POST /api/auth/google
const googleAuth = asyncHandler(async (req, res) => {
  const { credential, idToken: rawIdToken, accessToken, code, role } = req.body;
  const idToken = credential || rawIdToken;

  if (!idToken && !accessToken && !code) {
    throw new ApiError(400, 'Google authentication credential (idToken, accessToken, or authorization code) is required.');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  let googleUser = null;

  // 1. Authorization Code Exchange
  if (code) {
    try {
      const oauth2Client = new OAuth2Client(clientId, clientSecret, process.env.GOOGLE_REDIRECT_URI || 'postmessage');
      const { tokens } = await oauth2Client.getToken(code);
      if (tokens.id_token) {
        const ticket = await oauth2Client.verifyIdToken({
          idToken: tokens.id_token,
          audience: clientId || undefined,
        });
        googleUser = ticket.getPayload();
      } else if (tokens.access_token) {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        if (userInfoRes.ok) googleUser = await userInfoRes.json();
      }
    } catch (err) {
      console.error('[Google OAuth] Authorization code exchange failed:', err.message);
      throw new ApiError(401, `Google authorization code verification failed: ${err.message}`);
    }
  }

  // 2. ID Token (JWT) Verification
  if (!googleUser && idToken) {
    let verified = false;
    if (clientId) {
      try {
        const oauth2Client = new OAuth2Client(clientId);
        const ticket = await oauth2Client.verifyIdToken({
          idToken,
          audience: clientId,
        });
        googleUser = ticket.getPayload();
        verified = true;
      } catch (err) {
        console.warn('[Google OAuth] Local ID token verification warning:', err.message);
      }
    }

    if (!verified) {
      // Fallback verification via Google's official tokeninfo endpoint
      try {
        const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (tokenInfoRes.ok) {
          googleUser = await tokenInfoRes.json();
          verified = true;
        } else {
          const errData = await tokenInfoRes.json().catch(() => ({}));
          throw new Error(errData.error_description || 'Google token validation rejected');
        }
      } catch (err) {
        console.error('[Google OAuth] Tokeninfo verification error:', err.message);
        throw new ApiError(401, 'Invalid or expired Google ID token.');
      }
    }
  }

  // 3. Access Token Verification via Google UserInfo API
  if (!googleUser && accessToken) {
    try {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userInfoRes.ok) {
        throw new Error(`Google userinfo returned status ${userInfoRes.status}`);
      }
      googleUser = await userInfoRes.json();
    } catch (err) {
      console.error('[Google OAuth] Access token verification error:', err.message);
      throw new ApiError(401, 'Invalid or expired Google access token.');
    }
  }

  if (!googleUser || !googleUser.email) {
    throw new ApiError(401, 'Unable to retrieve verified email from Google.');
  }

  // Verify email is verified by Google
  const emailVerified = googleUser.email_verified === true || googleUser.email_verified === 'true';
  if (!emailVerified) {
    throw new ApiError(403, 'Your Google email address is not verified by Google.');
  }

  const lookupEmail = googleUser.email.toLowerCase().trim();
  const googleId = googleUser.sub || googleUser.id;
  const name = googleUser.name || googleUser.given_name || lookupEmail.split('@')[0];
  const picture = googleUser.picture || null;

  let user = await User.findOne({
    $or: [{ googleId }, { email: lookupEmail }],
  });

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
    if (user.authProvider !== 'google' && !user.googleId) {
      user.authProvider = 'google';
      updated = true;
    }
    if (updated) await user.save();

    await audit({ actor: user, action: 'USER_LOGIN_GOOGLE', entityType: 'User', entityId: user._id });
    const token = generateToken(user);
    return res.json({ success: true, token, user: user.toSafeObject() });
  }

  // New user - sign up with verified Google account
  const allowedSelfSignup = ['customer', 'provider'];
  const finalRole = allowedSelfSignup.includes(role) ? role : 'customer';

  // Generate random 24-char password for schema safety
  const randomPass = require('crypto').randomBytes(16).toString('hex') + 'A1!';

  user = await User.create({
    name: name.trim(),
    email: lookupEmail,
    password: randomPass,
    googleId,
    authProvider: 'google',
    avatarUrl: picture,
    role: finalRole,
    avatarColor: randomColor(),
    isVerified: true,
  });

  if (finalRole === 'provider') {
    await ProviderProfile.create({ user: user._id, serviceAreas: [] });
  }

  await audit({ actor: user, action: 'USER_REGISTERED_GOOGLE', entityType: 'User', entityId: user._id });

  const token = generateToken(user);
  res.status(201).json({ success: true, token, user: user.toSafeObject() });
});

module.exports = { register, login, googleAuth, getMe, updateMe, changePassword };
