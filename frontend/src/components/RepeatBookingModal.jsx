import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookings as bookingsApi } from '../lib/endpoints';
import { useToast } from '../context/ToastContext';
import { Modal, Button, Avatar, Spinner } from './ui';
import {
  RotateCcw,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Star,
  ArrowRight,
} from 'lucide-react';
import { format, addDays } from 'date-fns';

export default function RepeatBookingModal({ open, onClose, booking }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const thisWeekendStr = format(addDays(new Date(), 3), 'yyyy-MM-dd');

  const [date, setDate] = useState(tomorrowStr);
  const [timeWindow, setTimeWindow] = useState('Morning (9am - 12pm)');
  const [note, setNote] = useState('');

  if (!booking) return null;

  const provider = booking.provider;
  const providerUser = provider?.user || {};
  const categoryName = booking.category?.name || 'Home Service';

  const handleRepeatBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await bookingsApi.repeat(booking._id, {
        scheduledDate: date,
        preferredTimeWindow: timeWindow,
        note: note.trim() || `Repeat booking with ${providerUser.name} for ${categoryName}`,
      });

      toast.success(`Repeat booking created with ${providerUser.name}!`);
      onClose();
      if (res.data?._id) {
        navigate(`/customer/requests/${res.data._id}`);
      } else {
        navigate('/customer/bookings');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not complete repeat booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Repeat Booking (1-Click Rebook)"
      footer={null}
    >
      <form onSubmit={handleRepeatBooking} className="space-y-4">
        {/* Preferred Provider Card */}
        <div className="flex items-center gap-3.5 p-3.5 bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-200/80 rounded-2xl">
          <Avatar
            name={providerUser.name}
            color={providerUser.avatarColor}
            size={48}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-navy-900 truncate">
                {providerUser.name}
              </h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Preferred Pro
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Service: <strong className="text-navy-900">{categoryName}</strong>
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                <Star size={11} className="fill-amber-500" />
                Previous Top Rating
              </span>
              <span>•</span>
              <span>Direct Fast-Track Dispatch</span>
            </div>
          </div>
        </div>

        {/* Quick Date Presets */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Select Service Date
          </label>
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setDate(tomorrowStr)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                date === tomorrowStr
                  ? 'bg-[#152238] text-white border-[#152238]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Tomorrow ({format(addDays(new Date(), 1), 'MMM d')})
            </button>
            <button
              type="button"
              onClick={() => setDate(thisWeekendStr)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
                date === thisWeekendStr
                  ? 'bg-[#152238] text-white border-[#152238]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              This Weekend
            </button>
          </div>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#D98C2B] outline-none"
          />
        </div>

        {/* Preferred Time Window */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Preferred Time Window
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              'Morning (9am - 12pm)',
              'Afternoon (12pm - 4pm)',
              'Evening (4pm - 8pm)',
            ].map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTimeWindow(slot)}
                className={`p-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                  timeWindow === slot
                    ? 'bg-amber-50 border-[#D98C2B] text-[#925611] font-bold ring-1 ring-[#D98C2B]'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {slot.split(' ')[0]}
                <span className="block text-[10px] text-slate-400 font-normal">
                  {slot.match(/\((.*?)\)/)?.[1]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Notes / What needs to be done? (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Regular maintenance or same service as last time"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#D98C2B] outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || !date}
            className="bg-[#D98C2B] hover:bg-[#b8731f] text-white"
          >
            {submitting ? (
              <Spinner size={16} className="text-white" />
            ) : (
              <>
                <RotateCcw size={14} />
                <span>Confirm Repeat Booking</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
