import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePoll } from '../../hooks/usePoll';
import { bookings as bookingsApi } from '../../lib/endpoints';
import { Card, EmptyState, Spinner, Avatar, Button } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import RepeatBookingModal from '../../components/RepeatBookingModal';
import { CalendarClock, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

export default function CustomerBookings() {
  const { data, loading } = usePoll(() => bookingsApi.list({ limit: 50 }), [], 8000);
  const items = data?.data || [];
  const [repeatBooking, setRepeatBooking] = useState(null);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-semibold text-navy-900">My bookings</h1>
      <Card>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No bookings yet" message="Accepted quotes will show up here as scheduled jobs." />
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((b) => (
              <div key={b._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50/80 transition-colors">
                <Link to={`/customer/bookings/${b._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar name={b.provider?.user?.name} color={b.provider?.user?.avatarColor} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-900 hover:text-[#D98C2B] transition-colors">{b.category?.name}</p>
                    <p className="text-xs text-muted mt-0.5">
                      with {b.provider?.user?.name} · {format(new Date(b.scheduledDate), 'MMM d, yyyy')} · {b.scheduledStartTime}–{b.scheduledEndTime}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  {b.status === 'completed' && (
                    <button
                      type="button"
                      onClick={() => setRepeatBooking(b)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#925611] text-xs font-semibold border border-amber-200/80 transition-all cursor-pointer"
                      title="Rebook this same professional & service"
                    >
                      <RotateCcw size={13} />
                      <span>Book Again</span>
                    </button>
                  )}
                  <div className="text-right">
                    <p className="font-display font-semibold text-navy-900 text-sm">₹{b.price}</p>
                    <StatusBadge status={b.status} className="mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Repeat Booking Modal */}
      {repeatBooking && (
        <RepeatBookingModal
          open={Boolean(repeatBooking)}
          onClose={() => setRepeatBooking(null)}
          booking={repeatBooking}
        />
      )}
    </div>
  );
}
