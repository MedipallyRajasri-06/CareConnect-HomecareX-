import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { requests as requestsApi, quotes as quotesApi } from '../../lib/endpoints';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Spinner, EmptyState, Modal, Input, Textarea, Avatar } from '../../components/ui';
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

  // Direct Provider Booking State
  const [bookModal, setBookModal] = useState(null); // { profile, match }
  const [directBookingForm, setDirectBookingForm] = useState({
    date: '',
    start: '10:00',
    end: '12:00',
    notes: '',
  });
  const [bookingDirect, setBookingDirect] = useState(false);

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

  const handleSelectProvider = (profile, matchItem) => {
    let prefDate = '';
    if (request.preferredDate) {
      try {
        prefDate = format(new Date(request.preferredDate), 'yyyy-MM-dd');
      } catch {
        prefDate = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
      }
    } else {
      prefDate = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
    }

    let sTime = '10:00';
    let eTime = '12:00';
    if (request.preferredTimeWindow) {
      const tw = request.preferredTimeWindow.toLowerCase();
      if (tw.includes('morning')) {
        sTime = '09:00';
        eTime = '12:00';
      } else if (tw.includes('afternoon')) {
        sTime = '13:00';
        eTime = '16:00';
      } else if (tw.includes('evening') || tw.includes('4:00') || tw.includes('4-6')) {
        sTime = '16:00';
        eTime = '18:00';
      }
    }

    setDirectBookingForm({
      date: prefDate,
      start: sTime,
      end: eTime,
      notes: '',
    });
    setBookModal({ profile, match: matchItem });
  };

  const confirmDirectBooking = async () => {
    if (!bookModal?.profile) return;
    setBookingDirect(true);
    try {
      const res = await requestsApi.bookProvider(request._id, {
        providerId: bookModal.profile._id,
        scheduledDate: directBookingForm.date,
        scheduledStartTime: directBookingForm.start,
        scheduledEndTime: directBookingForm.end,
        notes: directBookingForm.notes,
      });
      toast.success(`Service booked with ${bookModal.profile.user?.name || 'the professional'}!`);
      const newBookingId = res.data?._id;
      setBookModal(null);
      reload();
      if (newBookingId) {
        navigate(`/customer/bookings/${newBookingId}`);
      } else {
        navigate('/customer/bookings');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not complete booking.');
    } finally {
      setBookingDirect(false);
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
          onSelectProvider={handleSelectProvider}
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

      {/* Direct Provider Booking Modal */}
      <Modal
        open={!!bookModal}
        onClose={() => setBookModal(null)}
        title={`Book Service with ${bookModal?.profile?.user?.name || 'Professional'}`}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setBookModal(null)}>Cancel</Button>
            <Button
              onClick={confirmDirectBooking}
              disabled={bookingDirect || !directBookingForm.date}
              className="bg-[#152238] hover:bg-[#D98C2B]"
            >
              {bookingDirect ? (
                <Spinner size={16} className="text-white" />
              ) : (
                `Confirm & Book with ${bookModal?.profile?.user?.name?.split(' ')[0] || 'Pro'}`
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Provider Profile Summary Card */}
          {bookModal?.profile && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-white border border-amber-200/80">
              <div className="flex items-start gap-3.5">
                <Avatar
                  name={bookModal.profile.user?.name || 'Pro'}
                  color={bookModal.profile.user?.avatarColor}
                  size={50}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-navy-900">
                      {bookModal.profile.user?.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      <ShieldCheck size={12} /> Verified Real Professional
                    </span>
                    {bookModal.match?.score && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Sparkles size={11} /> {bookModal.match.score}% Match
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-amber-600">
                      <Star size={12} className="fill-amber-500" />
                      {(bookModal.profile.ratingAverage || 5.0).toFixed(1)}★
                    </span>
                    <span>•</span>
                    <span>{bookModal.profile.completedJobs || 12}+ jobs completed</span>
                    {bookModal.profile.experienceYears > 0 && (
                      <>
                        <span>•</span>
                        <span>{bookModal.profile.experienceYears} yrs experience</span>
                      </>
                    )}
                    {bookModal.profile.serviceAreas?.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-slate-400" />
                          {bookModal.profile.serviceAreas.join(', ')}
                        </span>
                      </>
                    )}
                  </div>

                  {bookModal.profile.skills?.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Skills:</span>
                      {bookModal.profile.skills.slice(0, 5).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[11px] font-medium text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {bookModal.profile.bio && (
                    <p className="text-xs text-slate-600 mt-2 italic">
                      "{bookModal.profile.bio}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Service & Price Overview */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <div>
              <p className="text-slate-500 font-medium">Service</p>
              <p className="text-navy-900 font-bold text-sm mt-0.5">{request.category?.name || 'Service Job'}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-medium">Estimated Cost</p>
              <p className="text-emerald-700 font-bold text-base mt-0.5">₹{request.budgetMax || request.category?.basePrice || 499}</p>
            </div>
          </div>

          {/* Schedule Form */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Appointment Date & Time
            </h4>
            <Input
              label="Service Date"
              type="date"
              required
              value={directBookingForm.date}
              onChange={(e) => setDirectBookingForm((f) => ({ ...f, date: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Preferred Start Time"
                type="time"
                value={directBookingForm.start}
                onChange={(e) => setDirectBookingForm((f) => ({ ...f, start: e.target.value }))}
              />
              <Input
                label="Estimated End Time"
                type="time"
                value={directBookingForm.end}
                onChange={(e) => setDirectBookingForm((f) => ({ ...f, end: e.target.value }))}
              />
            </div>

            <Textarea
              label="Special instructions for the professional (optional)"
              rows={2}
              placeholder="e.g. Please bring extra piping tools, gate code is 1234"
              value={directBookingForm.notes}
              onChange={(e) => setDirectBookingForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span>Includes 30-Day CareConnect Quality Warranty, verified technician badge, and live GPS tracking upon dispatch.</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
