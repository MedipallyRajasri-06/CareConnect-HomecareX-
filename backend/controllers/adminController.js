const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { audit } = require('../services/auditService');

// @route GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const { role, q, page = 1, limit = 25 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (q) filter.$or = [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }];

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total } });
});

// @route POST /api/admin/users  (admin creates staff accounts: ops manager / support agent / admin)
const createStaffUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (!['admin', 'operations_manager', 'support_agent'].includes(role)) {
    throw new ApiError(400, 'Role must be one of admin, operations_manager, support_agent.');
  }
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'Email already in use.');

  const user = await User.create({ name, email: email.toLowerCase(), password, role, phone, isVerified: true });
  await audit({ actor: req.user, action: 'STAFF_USER_CREATED', entityType: 'User', entityId: user._id, details: { role } });
  res.status(201).json({ success: true, data: user.toSafeObject() });
});

// @route PUT /api/admin/users/:id/status  (activate/deactivate)
const setUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  user.isActive = !!isActive;
  await user.save();
  await audit({ actor: req.user, action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', entityType: 'User', entityId: user._id });
  res.json({ success: true, data: user.toSafeObject() });
});

// @route GET /api/admin/audit-logs
const listAuditLogs = asyncHandler(async (req, res) => {
  const { entityType, action, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (entityType) filter.entityType = entityType;
  if (action) filter.action = action;

  const skip = (Number(page) - 1) * Number(limit);
  const [data, total] = await Promise.all([
    AuditLog.find(filter).populate('actor', 'name role avatarColor').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    AuditLog.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total } });
});

module.exports = { listUsers, createStaffUser, setUserStatus, listAuditLogs };
