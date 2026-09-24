/**
 * Availability Engine
 * Handles time-slot overlap detection so providers never get double-booked.
 */

// Convert "HH:MM" -> minutes since midnight
const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Returns true if two time ranges on the same day overlap.
 */
const rangesOverlap = (startA, endA, startB, endB) => {
  const sA = toMinutes(startA);
  const eA = toMinutes(endA);
  const sB = toMinutes(startB);
  const eB = toMinutes(endB);
  return sA < eB && sB < eA;
};

/**
 * Checks whether a proposed slot (date + start/end) conflicts with any
 * of the provider's existing booked slots on the same calendar date.
 * existingSlots: array of { date, startTime, endTime, isBooked }
 */
const hasConflict = (existingSlots, date, startTime, endTime, excludeSlotId = null) => {
  const targetDateStr = new Date(date).toDateString();
  return existingSlots.some((slot) => {
    if (excludeSlotId && String(slot._id) === String(excludeSlotId)) return false;
    if (!slot.isBooked) return false;
    if (!slot.date) return false;
    const slotDateStr = new Date(slot.date).toDateString();
    if (slotDateStr !== targetDateStr) return false;
    return rangesOverlap(startTime, endTime, slot.startTime, slot.endTime);
  });
};

module.exports = { toMinutes, rangesOverlap, hasConflict };
