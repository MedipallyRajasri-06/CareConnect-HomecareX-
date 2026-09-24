import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { requests as requestsApi, providers as providersApi } from '../../lib/endpoints';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Input, Textarea, Spinner } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import { MapPin, Calendar, IndianRupee, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function ProviderRequestDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data: request, loading, reload } = usePoll(() => requestsApi.get(id).then((r) => r.data), [id], 6000);
  const { data: myQuotes } = usePoll(() => requestsApi.listQuotes(id).then((r) => r.data), [id], 6000);
  const { data: profile } = usePoll(() => providersApi.me().then((r) => r.data), []);

  const [form, setForm] = useState({ price: '', estimatedDuration: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  if (loading || !request) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  const myQuote = myQuotes?.[0];
  const canQuote = profile?.verificationStatus === 'verified' && !myQuote;

  const submitQuote = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await requestsApi.createQuote(id, {
        price: Number(form.price),
        estimatedDuration: form.estimatedDuration,
        message: form.message,
      });
      toast.success('Quote submitted to customer.');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit quote.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl font-semibold text-navy-900">{request.category?.name}</h1>
          <StatusBadge status={request.status} />
        </div>
        <p className="text-sm text-muted mt-1">{request.rawDescription}</p>
      </div>

      <Card className="p-5 grid sm:grid-cols-3 gap-4 text-sm">
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
            <p className="text-muted text-xs">Customer budget</p>
            <p className="text-navy-900">{request.budgetMax ? `Up to ₹${request.budgetMax}` : 'Not specified'}</p>
          </div>
        </div>
      </Card>

      {myQuote ? (
        <Card className="p-5">
          <p className="text-sm font-medium text-navy-900 mb-2">Your quote</p>
          <div className="flex items-center justify-between bg-gray-50 rounded-md px-4 py-3">
            <div>
              <p className="font-display font-semibold text-navy-900">₹{myQuote.price}</p>
              <p className="text-xs text-muted">{myQuote.estimatedDuration}</p>
            </div>
            <StatusBadge status={myQuote.status} />
          </div>
        </Card>
      ) : canQuote ? (
        <Card className="p-5">
          <p className="text-sm font-medium text-navy-900 mb-3">Submit a quote</p>
          <form onSubmit={submitQuote} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Price (₹)" type="number" min="1" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              <Input label="Estimated duration" placeholder="e.g. 2 hours" value={form.estimatedDuration} onChange={(e) => setForm((f) => ({ ...f, estimatedDuration: e.target.value }))} />
            </div>
            <Textarea label="Message to customer" rows={3} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? <Spinner size={16} className="text-white" /> : (<><Send size={15} /> Send quote</>)}
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="p-5 text-sm text-muted">
          {profile?.verificationStatus !== 'verified'
            ? 'You need to be a verified provider before submitting quotes.'
            : 'This request is no longer accepting quotes.'}
        </Card>
      )}
    </div>
  );
}
