import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { requests as requestsApi, quotes as quotesApi } from '../../lib/endpoints';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Spinner, EmptyState, Modal, Input, Avatar } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import { Sparkles, MapPin, Calendar, IndianRupee, Star, ShieldCheck, MessageSquare, Info, Camera, Video, Play, Image as ImageIcon, RotateCcw } from 'lucide-react';
import SmartMatchingCard from '../../components/SmartMatchingCard';
import { format } from 'date-fns';

export default function CustomerRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: request, loading, reload } = usePoll(() => requestsApi.get(id).then((r) => r.data), [id], 6000);
  const { data: quotesData, reload: reloadQuotes } = usePoll(
    () => requestsApi.listQuotes(id).then((r) => r.data),
    [id],
    6000
  );
  const [matching, setMatching] = useState(false);
  const [acceptModal, setAcceptModal] = useState(null); // quote
  const [scheduleForm, setScheduleForm] = useState({ date: '', start: '', end: '' });
  const [accepting, setAccepting] = useState(false);

  if (loading || !request) {
    return <div className="flex justify-center py-16"><Spinner size={28} /></div>;
  }

  const runMatching = async () => {
    setMatching(true);
    try {
      await requestsApi.match(id);
      toast.success('AI matching complete — providers notified.');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Matching failed.');
    } finally {
      setMatching(false);
    }
  };

  const openAccept = (quote) => {
    const firstSlot = quote.availableSlots?.[0];
    setScheduleForm({
      date: firstSlot ? format(new Date(firstSlot.date), 'yyyy-MM-dd') : '',
      start: firstSlot?.startTime || '',
      end: firstSlot?.endTime || '',
    });
    setAcceptModal(quote);
  };

  const confirmAccept = async () => {
    setAccepting(true);
    try {
      await quotesApi.accept(acceptModal._id, {
        scheduledDate: scheduleForm.date,
        scheduledStartTime: scheduleForm.start,
        scheduledEndTime: scheduleForm.end,
      });
      toast.success('Quote accepted — job scheduled!');
      setAcceptModal(null);
      navigate('/customer/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept quote.');
    } finally {
      setAccepting(false);
    }
  };

  const quoteList = quotesData || [];
  const rankedProviders = request.aiRankedProviders || [];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-semibold text-navy-900">{request.category?.name || 'Service request'}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-muted mt-1 max-w-lg">{request.rawDescription}</p>
        </div>
      </div>

      {request.isRepeatBooking && (
        <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/90 rounded-2xl text-xs text-amber-900 shadow-xs">
          <div className="p-2 rounded-xl bg-amber-100 text-[#925611]">
            <RotateCcw size={16} />
          </div>
          <div>
            <p className="font-bold text-navy-900">Repeat Booking Fast-Track</p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Targeted to your preferred provider {request.preferredProvider?.user?.name ? <strong>{request.preferredProvider.user.name}</strong> : ''}.
            </p>
          </div>
        </div>
      )}

      <Card className="p-5">
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <MapPin size={15} className="text-muted mt-0.5" />
            <div>
              <p className="text-muted text-xs">Location</p>
              <p className="text-navy-900">{request.location?.city}, {request.location?.state} {request.location?.zip}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={15} className="text-muted mt-0.5" />
            <div>
              <p className="text-muted text-xs">Preferred date</p>
              <p className="text-navy-900">{request.preferredDate ? format(new Date(request.preferredDate), 'MMM d, yyyy') : 'Flexible'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <IndianRupee size={15} className="text-muted mt-0.5" />
            <div>
              <p className="text-muted text-xs">Budget</p>
              <p className="text-navy-900">{request.budgetMax ? `Up to ₹${request.budgetMax}` : 'Not specified'}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-muted">
          <Sparkles size={13} className="text-amber-500" />
          AI confidence in category match: <span className="font-medium text-navy-900">{Math.round((request.aiConfidence || 0) * 100)}%</span>
        </div>
      </Card>

      {/* Customer Problem Photos & Videos Gallery */}
      {((request.media && request.media.length > 0) || (request.photos && request.photos.length > 0)) && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-[#D98C2B]" />
            <h3 className="text-sm font-bold text-navy-900">Problem Photos & Videos Attached</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(request.media && request.media.length > 0
              ? request.media
              : (request.photos || []).map((p) => ({ url: p, type: p.includes('.mp4') || p.includes('video') ? 'video' : 'photo' }))
            ).map((m, idx) => (
              <div
                key={idx}
                className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900 group shadow-xs"
              >
                {m.type === 'video' ? (
                  <video src={m.url} controls className="w-full h-full object-cover" />
                ) : (
                  <a href={m.url} target="_blank" rel="noreferrer" className="block w-full h-full">
                    <img
                      src={m.url}
                      alt={`Problem attachment ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </a>
                )}
                <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                  {m.type === 'video' ? <Video size={10} className="text-amber-400" /> : <ImageIcon size={10} className="text-emerald-400" />}
                  {m.type === 'video' ? 'Video' : 'Photo'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {['classified'].includes(request.status) && (
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-navy-900">Ready to find providers</p>
            <p className="text-xs text-muted mt-0.5">Run AI matching to rank and notify the best available providers.</p>
          </div>
          <Button onClick={runMatching} disabled={matching}>
            {matching ? <Spinner size={16} className="text-white" /> : (<><Sparkles size={15} /> Run AI matching</>)}
          </Button>
        </Card>
      )}

      {rankedProviders.length > 0 && (
        <SmartMatchingCard
          matches={rankedProviders}
        />
      )}

      <Card>
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-display font-semibold text-sm text-navy-900">Quotes received ({quoteList.length})</h2>
        </div>
        {quoteList.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No quotes yet" message="Providers will send quotes once matching runs and they review your request." />
        ) : (
          <div className="divide-y divide-gray-100">
            {quoteList.map((q) => (
              <div key={q._id} className="px-5 py-4 flex items-start gap-3">
                <Avatar name={q.provider?.user?.name} color={q.provider?.user?.avatarColor} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-navy-900">{q.provider?.user?.name}</p>
                    {q.provider?.verificationStatus === 'verified' && <ShieldCheck size={13} className="text-green-600" />}
                    {q.provider?.ratingAverage > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-muted">
                        <Star size={11} className="text-amber-500 fill-amber-500" /> {q.provider.ratingAverage.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">{q.message}</p>
                  <p className="text-[11px] text-gray-400 mt-1">Est. duration: {q.estimatedDuration || '—'}</p>
                </div>
                <div className="text-right shrink-0 space-y-2">
                  <p className="font-display font-semibold text-navy-900">₹{q.price}</p>
                  <StatusBadge status={q.status} />
                  {q.status === 'pending' && (
                    <Button className="block" onClick={() => openAccept(q)}>Accept</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={!!acceptModal}
        onClose={() => setAcceptModal(null)}
        title={`Schedule with ${acceptModal?.provider?.user?.name || 'provider'}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAcceptModal(null)}>Cancel</Button>
            <Button onClick={confirmAccept} disabled={accepting || !scheduleForm.date || !scheduleForm.start || !scheduleForm.end}>
              {accepting ? <Spinner size={16} className="text-white" /> : 'Confirm booking'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">Confirm a date & time. We'll check the provider's availability automatically.</p>
          <Input label="Date" type="date" value={scheduleForm.date} onChange={(e) => setScheduleForm((f) => ({ ...f, date: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start time" type="time" value={scheduleForm.start} onChange={(e) => setScheduleForm((f) => ({ ...f, start: e.target.value }))} />
            <Input label="End time" type="time" value={scheduleForm.end} onChange={(e) => setScheduleForm((f) => ({ ...f, end: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
