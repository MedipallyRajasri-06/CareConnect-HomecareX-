const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

// Verifies JWT and attaches req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }
  if (!token) throw new ApiError(401, 'Not authorized. No token provided.');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) throw new ApiError(401, 'User no longer exists or is inactive.');
    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(401, 'Not authorized. Invalid or expired token.');
  }
});

// Restricts a route to specific roles: authorize('admin','operations_manager')
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, `Role '${req.user?.role}' is not permitted to perform this action.`);
  }
  next();
};

module.exports = { protect, authorize };
