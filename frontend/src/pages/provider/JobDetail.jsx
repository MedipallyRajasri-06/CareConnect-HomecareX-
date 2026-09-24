import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { bookings as bookingsApi } from '../../lib/endpoints';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Spinner, Avatar, Textarea, Input } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import BookingChat from '../../components/BookingChat';
import { Phone, Mail, PlayCircle, CheckCircle2, Image as ImageIcon, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ProviderJobDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: booking, loading, reload } = usePoll(() => bookingsApi.get(id).then((r) => r.data), [id], 6000);
  const [activeTab, setActiveTab] = useState('chat');
  const [note, setNote] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  if (loading || !booking) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await bookingsApi.updateStatus(id, {
        status,
        note: note || undefined,
        attachments: attachmentUrl ? [attachmentUrl] : [],
      });
      toast.success(`Job marked as ${status.replace('_', ' ')}.`);
      setNote('');
      setAttachmentUrl('');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update job.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-navy-900">{booking.category?.name}</h1>
          <p className="text-sm text-muted mt-0.5">{format(new Date(booking.scheduledDate), 'EEEE, MMM d, yyyy')} · {booking.scheduledStartTime}–{booking.scheduledEndTime}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <Card className="p-5 flex items-center gap-4">
        <Avatar name={booking.customer?.name} color={booking.customer?.avatarColor} size={44} />
        <div className="flex-1">
          <p className="font-medium text-navy-900">{booking.customer?.name}</p>
          <div className="flex items-center gap-3 text-xs text-muted mt-1">
            {booking.customer?.phone && <span className="flex items-center gap-1"><Phone size={12} /> {booking.customer.phone}</span>}
            <span className="flex items-center gap-1"><Mail size={12} /> {booking.customer?.email}</span>
          </div>
        </div>
        <p className="font-display font-semibold text-lg text-navy-900">₹{booking.price}</p>
      </Card>

      {/* Tabs Switcher: Live Chat & Job Timeline */}
      <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-white text-navy-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          <MessageSquare size={14} className={activeTab === 'chat' ? 'text-[#D98C2B]' : 'text-slate-400'} />
          <span>Live Chat with Customer</span>
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'timeline'
              ? 'bg-white text-navy-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          <Clock size={14} className={activeTab === 'timeline' ? 'text-[#D98C2B]' : 'text-slate-400'} />
          <span>Job Timeline ({booking.updates?.length || 0})</span>
        </button>
      </div>

      {activeTab === 'chat' ? (
        <BookingChat
          bookingId={booking._id}
          otherUser={booking.customer}
          otherRole="Customer"
        />
      ) : (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-display font-semibold text-sm text-navy-900">Job timeline</h2>
          </div>
          <div className="p-5 space-y-4">
            {booking.updates?.map((u, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`h-2.5 w-2.5 rounded-full ${i === booking.updates.length - 1 ? 'bg-amber-500' : 'bg-gray-300'}`} />
                  {i < booking.updates.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={u.status} />
                    <span className="text-[11px] text-gray-400">{format(new Date(u.createdAt), 'MMM d, h:mm a')}</span>
                  </div>
                  {u.note && <p className="text-sm text-navy-900 mt-1">{u.note}</p>}
                  {u.attachments?.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                      <ImageIcon size={12} /> {u.attachments.length} attachment(s)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!['completed', 'cancelled', 'disputed'].includes(booking.status) && (
        <Card className="p-5 space-y-3">
          <p className="text-sm font-medium text-navy-900">Post an update</p>
          <Textarea placeholder="Add a note (optional)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          <Input placeholder="Photo/attachment URL (optional)" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} />
          <div className="flex gap-2">
            {booking.status === 'scheduled' && (
              <Button onClick={() => updateStatus('in_progress')} disabled={updating} className="flex-1">
                {updating ? <Spinner size={16} className="text-white" /> : (<><PlayCircle size={15} /> Start job</>)}
              </Button>
            )}
            {booking.status === 'in_progress' && (
              <Button onClick={() => updateStatus('completed')} disabled={updating} className="flex-1">
                {updating ? <Spinner size={16} className="text-white" /> : (<><CheckCircle2 size={15} /> Mark complete</>)}
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
