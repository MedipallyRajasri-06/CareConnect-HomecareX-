import { Link } from 'react-router-dom';
import { useState } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { requests as requestsApi } from '../../lib/endpoints';
import { Card, EmptyState, Spinner, Select } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import { ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['', 'submitted', 'classified', 'matching', 'quoted', 'scheduled', 'in_progress', 'completed', 'cancelled'];

export default function CustomerRequests() {
  const [status, setStatus] = useState('');
  const { data, loading } = usePoll(() => requestsApi.list({ status: status || undefined, limit: 50 }), [status]);
  const items = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-navy-900">My requests</h1>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All statuses'}</option>
          ))}
        </Select>
      </div>

      <Card>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No requests found" message="Try a different filter, or submit a new request." />
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((r) => (
              <Link key={r._id} to={`/customer/requests/${r._id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-navy-900">{r.category?.name || 'Uncategorized'}</p>
                    <span className="text-[11px] text-gray-400">· {format(new Date(r.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  <p className="text-xs text-muted truncate mt-0.5 max-w-lg">{r.rawDescription}</p>
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
