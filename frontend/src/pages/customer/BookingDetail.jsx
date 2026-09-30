import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { bookings as bookingsApi } from '../../lib/endpoints';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Spinner, Avatar, Modal, Textarea, Select } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import BookingChat from '../../components/BookingChat';
import LiveTrackingCard from '../../components/LiveTrackingCard';
import MaskedCallModal from '../../components/MaskedCallModal';
import WarrantyCard from '../../components/WarrantyCard';
import RepeatBookingModal from '../../components/RepeatBookingModal';
import { CheckCircle2, Star, AlertTriangle, Phone, Mail, MessageSquare, Clock, Navigation, RotateCcw, ShieldCheck, Camera, Video, Lock } from 'lucide-react';
import { format } from 'date-fns';

function StarPicker({ value = 0, onChange, label = 'rating', size = 26 }) {
  const [hovered, setHovered] = useState(0);
  const activeRating = hovered || value || 0;

  const handleKeyDown = (e) => {
    if (e.key >= '1' && e.key <= '5') {
      e.preventDefault();
      onChange(Number(e.key));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(5, (value || 0) + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(1, (value || 0) - 1));
    }
  };

  const labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div
      className="flex flex-col gap-1"
      role="radiogroup"
      aria-label={`Select ${label}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setHovered(0)}
    >
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= activeRating;
          return (
            <button
              key={starIndex}
              id={`star-rating-${starIndex}`}
              data-rating={starIndex}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setHovered(0);
                onChange(starIndex);
              }}
              onMouseEnter={() => setHovered(starIndex)}
              onFocus={() => setHovered(starIndex)}
              onBlur={() => setHovered(0)}
              aria-label={`${starIndex} star${starIndex === 1 ? '' : 's'}`}
              aria-checked={value === starIndex}
              role="radio"
              className="relative p-1.5 rounded-lg transition-transform duration-100 hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center select-none"
            >
              <Star
                size={size}
                className={`transition-colors duration-150 ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                    : 'text-slate-200 hover:text-slate-300'
                }`}
              />
            </button>
          );
        })}
        <span className="text-xs font-semibold text-slate-700 ml-2 min-w-[65px]">
          {activeRating > 0 ? labels[activeRating - 1] : 'Select rating'}
        </span>
      </div>
    </div>
  );
}

export default function CustomerBookingDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: booking, loading, reload } = usePoll(() => bookingsApi.get(id).then((r) => r.data), [id], 6000);
  const [activeTab, setActiveTab] = useState('tracking');
  const [confirming, setConfirming] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [review, setReview] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [dispute, setDispute] = useState({ reason: '', category: 'quality' });
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [maskedCallOpen, setMaskedCallOpen] = useState(false);
  const [repeatOpen, setRepeatOpen] = useState(false);

  const openReviewModal = () => {
    setReview({ rating: 0, comment: '' });
    setReviewOpen(true);
  };

  if (loading || !booking) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  const confirm = async () => {
    setConfirming(true);
    try {
      await bookingsApi.confirm(id);
      toast.success('Completion confirmed. You can now leave a review.');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not confirm.');
    } finally {
      setConfirming(false);
    }
  };

  const submitReview = async () => {
    if (!review.rating || review.rating < 1) {
      toast.error('Please choose a star rating (1 to 5) before submitting.');
      return;
    }
    setSubmittingReview(true);
    try {
      await bookingsApi.review(id, review);
      toast.success('Thanks for your review!');
      setReviewOpen(false);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitDispute = async () => {
    setSubmittingDispute(true);
    try {
      await bookingsApi.dispute(id, dispute);
      toast.success('Dispute opened. Our support team will follow up.');
      setDisputeOpen(false);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not open dispute.');
    } finally {
      setSubmittingDispute(false);
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
        <Avatar name={booking.provider?.user?.name} color={booking.provider?.user?.avatarColor} size={44} />
        <div className="flex-1">
          <p className="font-medium text-navy-900">{booking.provider?.user?.name}</p>
          <div className="flex items-center gap-3 text-xs text-muted mt-1">
            <button
              type="button"
              onClick={() => setMaskedCallOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/90 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Phone size={12} className="text-emerald-600" />
              <span>Masked Private Call</span>
            </button>
            <span className="flex items-center gap-1 text-slate-500"><Mail size={12} /> {booking.provider?.user?.email}</span>
          </div>
        </div>
        <p className="font-display font-semibold text-lg text-navy-900">₹{booking.price}</p>
      </Card>

      {/* Tabs Switcher: Live Tracking, Live Chat & Job Timeline */}
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
          <span>Live Tracking</span>
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
          <span>Live Chat</span>
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
          <span>Timeline ({booking.updates?.length || 0})</span>
        </button>
      </div>

      {activeTab === 'tracking' && (
        <LiveTrackingCard
          booking={booking}
          onOpenChat={() => setActiveTab('chat')}
          onOpenCall={() => setMaskedCallOpen(true)}
          onStatusUpdated={reload}
        />
      )}

      {activeTab === 'chat' && (
        <BookingChat
          bookingId={booking._id}
          otherUser={booking.provider?.user}
          otherRole="Provider"
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
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {booking.status === 'completed' && !booking.customerConfirmedAt && (
        <Card className="p-5 flex items-center justify-between">
          <p className="text-sm text-navy-900">Provider marked this job as complete. Confirm to close it out.</p>
          <Button onClick={confirm} disabled={confirming}>
            {confirming ? <Spinner size={16} className="text-white" /> : (<><CheckCircle2 size={15} /> Confirm completion</>)}
          </Button>
        </Card>
      )}

      {booking.status === 'completed' && booking.review && (
        <Card className="p-5 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-navy-900 flex items-center gap-1.5">
              <Star size={16} className="text-amber-500 fill-amber-500" /> Your Review
            </h3>
            <span className="text-xs font-semibold text-navy-900">
              Rating: {booking.review.rating} out of 5
            </span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                className={s <= booking.review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
              />
            ))}
          </div>
          {booking.review.comment && (
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
              "{booking.review.comment}"
            </p>
          )}
          {booking.review.providerResponse && (
            <div className="ml-3 pl-3 border-l-2 border-[#D98C2B]/40 bg-[#FFFDF9] p-3 rounded-r-lg border border-amber-100/50 space-y-1">
              <p className="text-xs font-semibold text-[#D98C2B]">Provider's response:</p>
              <p className="text-xs text-slate-700">{booking.review.providerResponse}</p>
            </div>
          )}
        </Card>
      )}

      {booking.status === 'completed' && (
        <WarrantyCard booking={booking} onClaimSubmitted={reload} />
      )}

      {booking.status === 'completed' && (
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setRepeatOpen(true)}
            className="flex-1 bg-[#D98C2B] hover:bg-[#b8731f] text-white"
          >
            <RotateCcw size={15} /> Book Again (1-Click Repeat)
          </Button>
          {!booking.review && (
            <Button variant="outline" className="flex-1" onClick={openReviewModal}>
              <Star size={15} /> Leave a review
            </Button>
          )}
          <Button variant="outline" className={booking.review ? "w-full sm:w-auto" : "flex-1"} onClick={() => setDisputeOpen(true)}>
            <AlertTriangle size={15} /> Report an issue
          </Button>
        </div>
      )}
      {['scheduled', 'on_the_way', 'arrived', 'in_progress'].includes(booking.status) && (
        <Button variant="outline" onClick={() => setDisputeOpen(true)}>
          <AlertTriangle size={15} /> Report an issue
        </Button>
      )}

      {/* Masked Call Modal */}
      <MaskedCallModal
        open={maskedCallOpen}
        onClose={() => setMaskedCallOpen(false)}
        bookingId={booking._id}
        otherUser={booking.provider?.user}
        otherRole="Provider"
      />

      {/* Repeat Booking Modal */}
      <RepeatBookingModal
        open={repeatOpen}
        onClose={() => setRepeatOpen(false)}
        booking={booking}
      />

      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title="Leave a review"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button onClick={submitReview} disabled={submittingReview || !review.rating}>
              {submittingReview ? <Spinner size={16} className="text-white" /> : 'Submit review'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-navy-900 mb-1.5">Rating *</p>
            <StarPicker
              value={review.rating}
              size={28}
              label="rating"
              onChange={(v) => setReview((r) => ({ ...r, rating: v }))}
            />
          </div>

          <Textarea
            label="Comment (optional)"
            rows={3}
            placeholder="How was your service experience? What went well?"
            value={review.comment}
            onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))}
          />
        </div>
      </Modal>

      <Modal
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        title="Report an issue"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDisputeOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={submitDispute} disabled={submittingDispute || !dispute.reason}>
              {submittingDispute ? <Spinner size={16} className="text-white" /> : 'Open dispute'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select label="Category" value={dispute.category} onChange={(e) => setDispute((d) => ({ ...d, category: e.target.value }))}>
            <option value="quality">Quality of work</option>
            <option value="no_show">Provider no-show</option>
            <option value="pricing">Pricing issue</option>
            <option value="damage">Property damage</option>
            <option value="behavior">Behavior/conduct</option>
            <option value="other">Other</option>
          </Select>
          <Textarea label="What happened?" required rows={4} value={dispute.reason} onChange={(e) => setDispute((d) => ({ ...d, reason: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}
