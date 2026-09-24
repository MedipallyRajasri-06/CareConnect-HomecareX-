import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { requests as requestsApi, quotes as quotesApi } from '../../lib/endpoints';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Spinner, EmptyState, Modal, Input, Avatar } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import { Sparkles, MapPin, Calendar, IndianRupee, Star, ShieldCheck, MessageSquare, Info } from 'lucide-react';
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
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-sm text-navy-900">AI-ranked provider matches</h2>
              <p className="text-xs text-muted mt-0.5">Matched and ordered by skill fit, rating, and verified track record.</p>
            </div>
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {rankedProviders.length} match{rankedProviders.length === 1 ? '' : 'es'}
            </span>
          </div>

          {request.matchingUsedFallback && (
            <div className="px-5 py-3 bg-amber-50/90 border-b border-amber-200/70 flex items-center gap-2.5 text-xs text-amber-900">
              <Info size={16} className="text-amber-600 shrink-0" />
              <div>
                <span className="font-semibold">Fallback matching active:</span> No exact category specialist was currently available. Showing closest verified providers in our network.
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {rankedProviders.slice(0, 5).map((rp) => {
              const rating = rp.ratingAverage ?? rp.provider?.ratingAverage ?? 0;
              const ratingCount = rp.provider?.ratingCount ?? 0;
              const jobs = rp.completedJobs ?? rp.provider?.completedJobs ?? 0;
              const expYears = rp.experienceYears ?? rp.provider?.experienceYears ?? 0;

              return (
                <div key={rp.provider?._id || rp.provider} className="px-5 py-3.5 flex items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Avatar name={rp.provider?.user?.name} color={rp.provider?.user?.avatarColor} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-navy-900">{rp.provider?.user?.name || 'Provider'}</p>
                        {rp.provider?.verificationStatus === 'verified' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                            <ShieldCheck size={11} /> Verified Pro
                          </span>
                        )}
                      </div>

                      {/* Explicit ranking stats: rating, completed jobs, experience */}
                      <div className="flex items-center gap-2.5 mt-1 text-xs text-muted flex-wrap">
                        <span className="inline-flex items-center gap-1 font-medium text-amber-800 bg-amber-50/80 px-1.5 py-0.5 rounded border border-amber-200/50">
                          <Star size={11} className="text-amber-500 fill-amber-500" />
                          {rating > 0 ? rating.toFixed(1) : 'New Pro'}
                          {ratingCount > 0 && <span className="text-gray-400 font-normal">({ratingCount})</span>}
                        </span>
                        <span className="font-medium text-navy-900">
                          {jobs} {jobs === 1 ? 'job' : 'jobs'} completed
                        </span>
                        {expYears > 0 && (
                          <span>
                            · {expYears} yrs exp
                          </span>
                        )}
                        {rp.provider?.serviceAreas?.length > 0 && (
                          <span className="text-gray-400 truncate max-w-[180px]">
                            · {rp.provider.serviceAreas.join(', ')}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted mt-1 truncate">{(rp.reasons || []).join(' · ')}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-muted font-medium">Match score</p>
                    <p className="font-display text-base font-bold text-[#2F8F5B]">{rp.score}<span className="text-xs text-gray-400 font-normal">/100</span></p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
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
