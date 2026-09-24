import { usePoll } from '../../hooks/usePoll';
import { admin as adminApi } from '../../lib/endpoints';
import { Card, EmptyState, Spinner, Avatar } from '../../components/ui';
import { ScrollText } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminAuditLog() {
  const { data, loading } = usePoll(() => adminApi.auditLogs({ limit: 100 }), [], 10000);
  const items = data?.data || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900">Audit log</h1>
        <p className="text-sm text-muted mt-0.5">Full trail of administrative & operational actions.</p>
      </div>

      <Card>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={ScrollText} title="No activity yet" />
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((a) => (
              <div key={a._id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={a.actor?.name || '?'} color={a.actor?.avatarColor} size={28} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy-900">
                    <span className="font-medium">{a.actor?.name || 'System'}</span>{' '}
                    <span className="text-muted">performed</span>{' '}
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{a.action}</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {a.entityType} · {format(new Date(a.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
