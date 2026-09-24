import { Link } from 'react-router-dom';
import { useState } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { disputes as disputesApi } from '../../lib/endpoints';
import { Card, EmptyState, Spinner, Avatar, Select } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function DisputesList({ basePath = '/admin/disputes' }) {
  const [status, setStatus] = useState('');
  const { data, loading } = usePoll(() => disputesApi.list({ status: status || undefined }).then((r) => r.data), [status], 8000);
  const items = data || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900">Disputes</h1>
          <p className="text-sm text-muted mt-0.5">Investigate and resolve customer/provider disputes.</p>
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      <Card>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No disputes found" message="All quiet — nothing here." />
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((d) => (
              <Link key={d._id} to={`${basePath}/${d._id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50">
                <Avatar name={d.raisedBy?.name} color={d.raisedBy?.avatarColor} size={34} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-900">{d.booking?.category?.name || 'Booking'} — {d.category.replace('_', ' ')}</p>
                  <p className="text-xs text-muted truncate mt-0.5 max-w-lg">{d.reason}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Raised by {d.raisedBy?.name} · {format(new Date(d.createdAt), 'MMM d, yyyy')}
                    {d.assignedTo && <> · assigned to {d.assignedTo.name}</>}
                  </p>
                </div>
                <StatusBadge status={d.status} className="shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
