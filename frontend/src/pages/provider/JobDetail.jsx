import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { bookings as bookingsApi } from '../../lib/endpoints';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Spinner, Avatar, Textarea, Input } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import BookingChat from '../../components/BookingChat';
import LiveTrackingCard from '../../components/LiveTrackingCard';
import MaskedCallModal from '../../components/MaskedCallModal';
import { Phone, Mail, PlayCircle, CheckCircle2, Image as ImageIcon, MessageSquare, Clock, Navigation, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export default function ProviderJobDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: booking, loading, reload } = usePoll(() => bookingsApi.get(id).then((r) => r.data), [id], 6000);
  const [activeTab, setActiveTab] = useState('tracking');
  const [note, setNote] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const [maskedCallOpen, setMaskedCallOpen] = useState(false);

  if (loading || !booking) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await bookingsApi.updateStatus(id, {
        status,
        note: note || undefined,
        attachments: attachmentUrl ? [attachmentUrl] : [],
        estimatedArrivalMins: status === 'on_the_way' ? 12 : status === 'arrived' ? 0 : undefined,
        distanceKm: status === 'on_the_way' ? 2.8 : status === 'arrived' ? 0 : undefined,
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
            <button
              type="button"
              onClick={() => setMaskedCallOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/90 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Phone size={12} className="text-emerald-600" />
              <span>Masked Private Call</span>
            </button>
            <span className="flex items-center gap-1 text-slate-500"><Mail size={12} /> {booking.customer?.email}</span>
          </div>
        </div>
        <p className="font-display font-semibold text-lg text-navy-900">₹{booking.price}</p>
      </Card>

      {/* Tabs Switcher: Live Transit & Tracking, Live Chat & Job Timeline */}
      <div className="flex items-center gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('tracking')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'tracking'
              ? 'bg-white text-navy-900 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          <Navigation size={14} className={activeTab === 'tracking' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>Transit & Tracking</span>
          {['on_the_way', 'arrived'].includes(booking.status) && (
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          )}
        </button>
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

      {activeTab === 'tracking' && (
        <LiveTrackingCard
          booking={booking}
          isProvider={true}
          onStatusUpdated={reload}
          onOpenChat={() => setActiveTab('chat')}
          onOpenCall={() => setMaskedCallOpen(true)}
        />
      )}

      {activeTab === 'chat' && (
        <BookingChat
          bookingId={booking._id}
          otherUser={booking.customer}
          otherRole="Customer"
        />
      )}

      {activeTab === 'timeline' && (
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
          <div className="flex flex-wrap gap-2">
            {booking.status === 'scheduled' && (
              <>
                <Button onClick={() => updateStatus('on_the_way')} disabled={updating} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  {updating ? <Spinner size={16} className="text-white" /> : (<><Navigation size={15} /> Start Travel (On the Way)</>)}
                </Button>
                <Button onClick={() => updateStatus('in_progress')} disabled={updating} variant="outline">
                  <PlayCircle size={15} /> Start job
                </Button>
              </>
            )}
            {booking.status === 'on_the_way' && (
              <>
                <Button onClick={() => updateStatus('arrived')} disabled={updating} className="flex-1 bg-amber-600 hover:bg-amber-700">
                  {updating ? <Spinner size={16} className="text-white" /> : (<><MapPin size={15} /> Mark Arrived</>)}
                </Button>
                <Button onClick={() => updateStatus('in_progress')} disabled={updating} variant="outline">
                  <PlayCircle size={15} /> Start job
                </Button>
              </>
            )}
            {booking.status === 'arrived' && (
              <Button onClick={() => updateStatus('in_progress')} disabled={updating} className="flex-1">
                {updating ? <Spinner size={16} className="text-white" /> : (<><PlayCircle size={15} /> Start job</>)}
              </Button>
            )}
            {booking.status === 'in_progress' && (
              <Button onClick={() => updateStatus('completed')} disabled={updating} className="flex-1 bg-emerald-700 hover:bg-emerald-800">
                {updating ? <Spinner size={16} className="text-white" /> : (<><CheckCircle2 size={15} /> Mark complete</>)}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* In-App Private Masked Call Modal */}
      <MaskedCallModal
        open={maskedCallOpen}
        onClose={() => setMaskedCallOpen(false)}
        bookingId={booking._id}
        otherUser={booking.customer}
        otherRole="Customer"
      />
    </div>
  );
}
