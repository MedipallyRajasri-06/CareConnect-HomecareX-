import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { disputes as disputesApi } from '../../lib/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Textarea, Select, Spinner, Avatar } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import { Send, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

const STAFF_ROLES = ['admin', 'operations_manager', 'support_agent'];

export default function DisputeDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const { data: dispute, loading, reload } = usePoll(() => disputesApi.get(id).then((r) => r.data), [id], 6000);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [resolution, setResolution] = useState({ resolution: '', resolutionAction: 'none', status: 'resolved' });
  const [resolving, setResolving] = useState(false);

  if (loading || !dispute) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  const isStaff = STAFF_ROLES.includes(user.role);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      await disputesApi.addMessage(id, message);
      setMessage('');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  const assignToMe = async () => {
    try {
      await disputesApi.assign(id, user._id);
      toast.success('Dispute assigned to you.');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not assign.');
    }
  };

  const resolve = async (targetStatus) => {
    const finalStatus = targetStatus || resolution.status;
    setResolving(true);
    try {
      await disputesApi.resolve(id, { ...resolution, status: finalStatus });
      toast.success(`Dispute marked as ${finalStatus}.`);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not resolve dispute.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-navy-900">
            {dispute.booking?.category?.name || 'Booking'} dispute
          </h1>
          <p className="text-sm text-muted mt-0.5 capitalize">{dispute.category.replace('_', ' ')}</p>
        </div>
        <StatusBadge status={dispute.status} />
      </div>

      <Card className="p-5 grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted text-xs">Customer</p>
          <p className="text-navy-900">{dispute.booking?.customer?.name}</p>
        </div>
        <div>
          <p className="text-muted text-xs">Provider</p>
          <p className="text-navy-900">{dispute.booking?.provider?.user?.name}</p>
        </div>
        <div>
          <p className="text-muted text-xs">Raised by</p>
          <p className="text-navy-900">{dispute.raisedBy?.name}</p>
        </div>
        <div>
          <p className="text-muted text-xs">Assigned to</p>
          <p className="text-navy-900">
            {dispute.assignedTo?.name || (isStaff ? <button onClick={assignToMe} className="text-blue-600 hover:underline text-xs">Assign to me</button> : 'Unassigned')}
          </p>
        </div>
      </Card>

      <Card>
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-display font-semibold text-sm text-navy-900">Conversation</h2>
        </div>
        <div className="p-5 space-y-4 max-h-80 overflow-y-auto">
          {dispute.thread.map((m, i) => (
            <div key={i} className="flex gap-2.5">
              <Avatar name={m.sender?.name} color={m.sender?.avatarColor} size={28} />
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-navy-900">{m.sender?.name}</p>
                  {STAFF_ROLES.includes(m.sender?.role) && <ShieldCheck size={12} className="text-blue-600" />}
                  <span className="text-[11px] text-gray-400">{format(new Date(m.createdAt), 'MMM d, h:mm a')}</span>
                </div>
                <p className="text-sm text-navy-900 mt-0.5">{m.message}</p>
              </div>
            </div>
          ))}
        </div>
        {!['resolved', 'rejected'].includes(dispute.status) && (
          <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 flex gap-2">
            <Textarea rows={1} placeholder="Write a message..." value={message} onChange={(e) => setMessage(e.target.value)} className="flex-1" />
            <Button type="submit" disabled={sending}><Send size={15} /></Button>
          </form>
        )}
      </Card>

      {isStaff && !['resolved', 'rejected'].includes(dispute.status) && (
        <Card className="p-5 space-y-4">
          <p className="text-sm font-medium text-navy-900">Resolve dispute</p>
          <Select label="Action" value={resolution.resolutionAction} onChange={(e) => setResolution((r) => ({ ...r, resolutionAction: e.target.value }))}>
            <option value="none">No action</option>
            <option value="refund">Full refund</option>
            <option value="partial_refund">Partial refund</option>
            <option value="reschedule">Reschedule job</option>
            <option value="warning_issued">Warning issued to provider</option>
            <option value="provider_suspended">Suspend provider</option>
          </Select>
          <Textarea label="Resolution notes" rows={3} value={resolution.resolution} onChange={(e) => setResolution((r) => ({ ...r, resolution: e.target.value }))} />
          <div className="flex gap-2">
            <Button onClick={() => resolve('resolved')} disabled={resolving} className="flex-1">
              {resolving ? <Spinner size={16} className="text-white" /> : 'Mark resolved'}
            </Button>
            <Button variant="outline" onClick={() => resolve('rejected')} disabled={resolving} className="flex-1">
              Reject dispute
            </Button>
          </div>
        </Card>
      )}

      {dispute.status === 'resolved' && dispute.resolution && (
        <Card className="p-5 bg-green-50/40 border-green-200">
          <p className="text-sm font-medium text-navy-900">Resolution</p>
          <p className="text-sm text-muted mt-1">{dispute.resolution}</p>
        </Card>
      )}
    </div>
  );
}
