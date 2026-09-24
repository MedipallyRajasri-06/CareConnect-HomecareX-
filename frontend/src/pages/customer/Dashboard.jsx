import { Link } from 'react-router-dom';
import { usePoll } from '../../hooks/usePoll';
import { requests as requestsApi, bookings as bookingsApi } from '../../lib/endpoints';
import { Card, StatTile, Button, EmptyState, Spinner } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import { ClipboardList, CalendarClock, PlusCircle, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function CustomerDashboard() {
  const { data: reqData, loading: reqLoading } = usePoll(() => requestsApi.list({ limit: 5 }), []);
  const { data: bkData, loading: bkLoading } = usePoll(() => bookingsApi.list({ limit: 5 }), []);

  const requests = reqData?.data || [];
  const bookingsList = bkData?.data || [];
  const activeCount = requests.filter((r) => !['completed', 'cancelled'].includes(r.status)).length;
  const upcoming = bookingsList.filter((b) => b.status === 'scheduled' || b.status === 'in_progress');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900">Overview</h1>
          <p className="text-sm text-muted mt-0.5">Track your requests and upcoming jobs in one place.</p>
        </div>
        <Link to="/customer/new-request">
          <Button>
            <PlusCircle size={16} /> New request
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile label="Active requests" value={activeCount} accent="amber" icon={ClipboardList} />
        <StatTile label="Upcoming bookings" value={upcoming.length} accent="blue" icon={CalendarClock} />
        <StatTile label="Total requests" value={reqData?.pagination?.total ?? '—'} accent="navy" icon={Sparkles} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-display font-semibold text-navy-900 text-sm">Recent requests</h2>
            <Link to="/customer/requests" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {reqLoading ? (
            <div className="p-8 flex justify-center"><Spinner /></div>
          ) : requests.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No requests yet" message="Describe a job and let our AI match you with the right provider." />
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map((r) => (
                <Link key={r._id} to={`/customer/requests/${r._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{r.category?.name || 'Uncategorized'}</p>
                    <p className="text-xs text-muted truncate mt-0.5">{r.rawDescription}</p>
                  </div>
                  <StatusBadge status={r.status} className="shrink-0 ml-3" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-display font-semibold text-navy-900 text-sm">Upcoming & recent bookings</h2>
            <Link to="/customer/bookings" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {bkLoading ? (
            <div className="p-8 flex justify-center"><Spinner /></div>
          ) : bookingsList.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No bookings yet" message="Once you accept a quote, your job will appear here." />
          ) : (
            <div className="divide-y divide-gray-100">
              {bookingsList.map((b) => (
                <Link key={b._id} to={`/customer/bookings/${b._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{b.category?.name}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {format(new Date(b.scheduledDate), 'MMM d')} · {b.scheduledStartTime}–{b.scheduledEndTime} · with {b.provider?.user?.name}
                    </p>
                  </div>
                  <StatusBadge status={b.status} className="shrink-0 ml-3" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
