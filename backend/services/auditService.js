const AuditLog = require('../models/AuditLog');

const audit = async ({ actor, action, entityType, entityId, details = {}, ipAddress = '' }) => {
  try {
    return await AuditLog.create({
      actor: actor?._id,
      actorRole: actor?.role,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
    });
  } catch (err) {
    console.error('[audit] failed to write audit log:', err.message);
    return null;
  }
};

module.exports = { audit };
