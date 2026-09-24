import { Link } from 'react-router-dom';
import { usePoll } from '../../hooks/usePoll';
import { bookings as bookingsApi } from '../../lib/endpoints';
import { Card, EmptyState, Spinner, Avatar } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import { Wrench } from 'lucide-react';
import { format } from 'date-fns';

export default function ProviderJobs() {
  const { data, loading } = usePoll(() => bookingsApi.list({ limit: 50 }), [], 8000);
  const items = data?.data || [];

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-semibold text-navy-900">My jobs</h1>
      <Card>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={Wrench} title="No jobs yet" message="Accepted quotes turn into scheduled jobs here." />
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((b) => (
              <Link key={b._id} to={`/provider/jobs/${b._id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50">
                <Avatar name={b.customer?.name} color={b.customer?.avatarColor} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-900">{b.category?.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    for {b.customer?.name} · {format(new Date(b.scheduledDate), 'MMM d, yyyy')} · {b.scheduledStartTime}–{b.scheduledEndTime}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display font-semibold text-navy-900 text-sm">₹{b.price}</p>
                  <StatusBadge status={b.status} className="mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
