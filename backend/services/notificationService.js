const Notification = require('../models/Notification');

/**
 * Creates a notification for a user. Kept as a single choke point so the
 * frontend can poll one endpoint for a unified "live" activity feed.
 */
const notify = async ({ user, type, title, message, link = '' }) => {
  try {
    return await Notification.create({ user, type, title, message, link });
  } catch (err) {
    console.error('[notify] failed to create notification:', err.message);
    return null;
  }
};

module.exports = { notify };
