import { Link } from 'react-router-dom';
import { usePoll } from '../../hooks/usePoll';
import { requests as requestsApi } from '../../lib/endpoints';
import { Card, EmptyState, Spinner } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import { ClipboardList, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export default function ProviderRequests() {
  const { data, loading } = usePoll(() => requestsApi.list({ limit: 50 }), [], 8000);
  const items = data?.data || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900">Matched requests</h1>
        <p className="text-sm text-muted mt-0.5">Requests our AI engine has ranked as a fit for your skills and area.</p>
      </div>
      <Card>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No matches yet" message="Keep your profile & availability up to date to receive more matches." />
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((r) => (
              <Link key={r._id} to={`/provider/requests/${r._id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-navy-900">{r.category?.name}</p>
                    <span className="text-[11px] text-gray-400">· {format(new Date(r.createdAt), 'MMM d')}</span>
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5 max-w-lg">{r.rawDescription}</p>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
                    <MapPin size={11} /> {r.location?.city}, {r.location?.state}
                  </p>
                </div>
                <StatusBadge status={r.status} className="shrink-0 ml-3" />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
