import { useState } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { providers as providersApi } from '../../lib/endpoints';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Avatar, Spinner, EmptyState, Select } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import { ShieldCheck, Star } from 'lucide-react';

export default function AdminProviders() {
  const [filter, setFilter] = useState('');
  const { data, loading, reload } = usePoll(() => providersApi.list({ verified: filter || undefined, limit: 100 }), [filter], 10000);
  const toast = useToast();
  const items = data?.data || [];

  const setStatus = async (id, status) => {
    try {
      await providersApi.verify(id, { status });
      toast.success(`Provider marked as ${status}.`);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900">Providers</h1>
          <p className="text-sm text-muted mt-0.5">Review documents and verify providers before they can quote jobs.</p>
        </div>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      <Card>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No providers found" />
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((p) => (
              <div key={p._id} className="flex items-center gap-3 px-5 py-4">
                <Avatar name={p.user?.name} color={p.user?.avatarColor} size={38} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-900">{p.user?.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {(p.categories || []).map((c) => c.name).join(', ') || 'No categories set'} · {p.serviceAreas?.join(', ')}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                    <span>{p.documents?.length || 0} document(s) submitted</span>
                    {p.ratingCount > 0 && (
                      <span className="flex items-center gap-0.5"><Star size={10} className="text-amber-500 fill-amber-500" /> {p.ratingAverage.toFixed(1)}</span>
                    )}
                    <span>{p.completedJobs} jobs completed</span>
                  </div>
                </div>
                <StatusBadge status={p.verificationStatus} className="shrink-0" />
                <div className="flex items-center gap-1.5 shrink-0">
                  {p.verificationStatus !== 'verified' && (
                    <Button variant="primary" className="!px-3 !py-1.5 text-xs" onClick={() => setStatus(p._id, 'verified')}>Verify</Button>
                  )}
                  {p.verificationStatus !== 'rejected' && (
                    <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => setStatus(p._id, 'rejected')}>Reject</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
