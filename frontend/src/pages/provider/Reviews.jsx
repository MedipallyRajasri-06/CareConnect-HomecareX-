import { useState } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { providers as providersApi, reviews as reviewsApi } from '../../lib/endpoints';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Avatar, Spinner, EmptyState, Textarea } from '../../components/ui';
import { Star, MessageSquare, CornerDownRight, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ProviderReviews() {
  const toast = useToast();
  const { data: profile, loading: profileLoading } = usePoll(() => providersApi.me().then((r) => r.data), []);
  const { data: reviewsData, loading: reviewsLoading, reload } = usePoll(
    () => providersApi.reviews('me').then((r) => r.data),
    [],
    6000
  );

  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const reviews = reviewsData || [];
  const loading = profileLoading || reviewsLoading;

  const startReply = (review) => {
    setReplyingId(review._id);
    setReplyText(review.providerResponse || '');
  };

  const cancelReply = () => {
    setReplyingId(null);
    setReplyText('');
  };

  const submitReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await reviewsApi.respond(reviewId, replyText.trim());
      toast.success('Response saved successfully.');
      setReplyingId(null);
      setReplyText('');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit response.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Compute metrics
  const avgRating = profile?.ratingAverage || (reviews.length > 0 ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1) : 0);
  const totalReviews = profile?.ratingCount || reviews.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900">My Reviews</h1>
        <p className="text-sm text-muted mt-0.5">
          Feedback and ratings from homeowners and property managers on your completed jobs.
        </p>
      </div>

      {/* Summary Stat Card */}
      {profile && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4 bg-white">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-500 shrink-0">
              <Star size={24} className="fill-amber-400 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Rating</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-display text-2xl font-bold text-navy-900">
                  {Number(avgRating) > 0 ? Number(avgRating).toFixed(1) : 'New'}
                </span>
                <span className="text-xs text-muted">/ 5.0</span>
              </div>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4 bg-white">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
              <MessageSquare size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Total Reviews</p>
              <p className="font-display text-2xl font-bold text-navy-900 mt-0.5">{totalReviews}</p>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4 bg-white">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider">Completed Jobs</p>
              <p className="font-display text-2xl font-bold text-navy-900 mt-0.5">{profile.completedJobs || 0}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Reviews List */}
      <Card className="bg-white">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-display font-semibold text-sm text-navy-900">
            Customer Feedback ({reviews.length})
          </h2>
          <span className="text-xs text-muted">Verified booking reviews</span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Spinner size={32} />
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews yet"
            message="When customers complete jobs and leave ratings or feedback, they will appear here."
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((rev) => (
              <div key={rev._id} className="p-6 space-y-4">
                {/* Review Header: Customer & Stars */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={rev.customer?.name}
                      color={rev.customer?.avatarColor}
                      size={40}
                    />
                    <div>
                      <p className="text-sm font-semibold text-navy-900">
                        {rev.customer?.name || 'Customer'}
                      </p>
                      <p className="text-xs text-muted">
                        {rev.createdAt ? format(new Date(rev.createdAt), 'MMMM d, yyyy') : 'Recent review'}
                      </p>
                    </div>
                  </div>

                  {/* Star Rating Display */}
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={16}
                          className={s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-navy-900 mt-1">
                      Rating: {rev.rating} out of 5
                    </span>
                  </div>
                </div>

                {/* Comment */}
                {rev.comment && (
                  <p className="text-sm text-slate-700 leading-relaxed bg-white">
                    "{rev.comment}"
                  </p>
                )}

                {/* Existing Provider Response */}
                {rev.providerResponse && replyingId !== rev._id && (
                  <div className="ml-4 sm:ml-8 pl-4 border-l-2 border-[#D98C2B]/40 bg-[#FFFDF9] p-4 rounded-r-xl border border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D98C2B]">
                        <CornerDownRight size={14} /> Your public response
                      </span>
                      <button
                        onClick={() => startReply(rev)}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Edit response
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {rev.providerResponse}
                    </p>
                  </div>
                )}

                {/* Inline Reply Box */}
                {replyingId === rev._id ? (
                  <div className="ml-4 sm:ml-8 mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <p className="text-xs font-semibold text-navy-900 flex items-center gap-1.5">
                      <CornerDownRight size={14} className="text-[#D98C2B]" />
                      Write a response to {rev.customer?.name || 'this customer'}:
                    </p>
                    <Textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Thank the customer for their business, or address any specific feedback professionally..."
                      className="text-sm bg-white"
                      autoFocus
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={cancelReply} disabled={submittingReply}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => submitReply(rev._id)}
                        disabled={submittingReply || !replyText.trim()}
                      >
                        {submittingReply ? <Spinner size={14} className="text-white" /> : 'Publish Response'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  !rev.providerResponse && (
                    <div className="pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="!text-xs gap-1.5"
                        onClick={() => startReply(rev)}
                      >
                        <MessageSquare size={13} /> Respond to review
                      </Button>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
