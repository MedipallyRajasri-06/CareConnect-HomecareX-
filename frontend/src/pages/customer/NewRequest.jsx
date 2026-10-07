import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requests as requestsApi, categories as categoriesApi } from '../../lib/endpoints';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Input, Textarea, Select, Spinner } from '../../components/ui';
import MediaUpload from '../../components/MediaUpload';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function NewRequest() {
  const [form, setForm] = useState({
    rawDescription: '', urgency: 'normal', city: '', state: '', zip: '', line1: '',
    preferredDate: '', preferredTimeWindow: '', budgetMax: '',
  });
  const [media, setMedia] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { data, ai }
  const [chosenCategory, setChosenCategory] = useState('');
  const [matching, setMatching] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    categoriesApi.list().then(({ data }) => setCategories(data));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        rawDescription: form.rawDescription,
        urgency: form.urgency,
        location: { line1: form.line1, city: form.city, state: form.state, zip: form.zip },
        preferredDate: form.preferredDate || undefined,
        preferredTimeWindow: form.preferredTimeWindow,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        media: media.length > 0 ? media : undefined,
        photos: media.map((m) => m.url),
      };
      const res = await requestsApi.create(payload);
      setResult(res);
      setChosenCategory(res.data?.category?._id || res.data?.category || '');
      toast.success('Request submitted — AI classification complete.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmAndMatch = async () => {
    setMatching(true);
    try {
      const currentCatId = result.data?.category?._id || result.data?.category;
      if (chosenCategory && String(chosenCategory) !== String(currentCatId)) {
        await requestsApi.updateCategory(result.data._id, chosenCategory);
      }
      await requestsApi.match(result.data._id);
      toast.success('Matching providers found!');
      navigate(`/customer/requests/${result.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not run matching.');
    } finally {
      setMatching(false);
    }
  };

  if (result) {
    const suggested = categories.find((c) => c._id === result.ai.suggestedCategory?._id) || result.ai.suggestedCategory;
    return (
      <div className="max-w-xl mx-auto space-y-5">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-3">
            <CheckCircle2 size={22} className="text-green-600" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-navy-900">Request received</h1>
          <p className="text-sm text-muted mt-1">Here's what our AI classifier found. Confirm or adjust the category below.</p>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-amber-500" />
            <p className="text-sm font-medium text-navy-900">AI suggested category</p>
          </div>
          <div className="flex items-center justify-between bg-amber-100/50 border border-amber-200 rounded-md px-4 py-3 mb-4">
            <div>
              <p className="font-display font-semibold text-navy-900">{suggested?.name}</p>
              <p className="text-xs text-muted mt-0.5">
                Required skills detected: {result.data.aiRequiredSkills?.slice(0, 5).join(', ') || '—'}
              </p>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="text-xs text-muted">Confidence</p>
              <p className="font-display font-semibold text-navy-900">{Math.round((result.ai.confidence || 0) * 100)}%</p>
            </div>
          </div>

          <Select label="Confirm or change category" value={chosenCategory} onChange={(e) => setChosenCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </Select>

          <Button onClick={confirmAndMatch} disabled={matching} className="w-full mt-5">
            {matching ? <Spinner size={16} className="text-white" /> : (<>Find matching providers <ArrowRight size={15} /></>)}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900">Request a service</h1>
        <p className="text-sm text-muted mt-1">
          Describe what you need in plain language — our AI will classify it and match you with the best available providers.
        </p>
      </div>

      <Card className="p-5">
        <form onSubmit={submit} className="space-y-4">
          <Textarea
            label="What do you need help with?"
            required
            rows={4}
            placeholder="e.g. My kitchen sink is leaking and water is pooling under the cabinet"
            value={form.rawDescription}
            onChange={set('rawDescription')}
          />

          <MediaUpload media={media} onChange={setMedia} />

          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Urgency" value={form.urgency} onChange={set('urgency')}>
              <option value="low">Low — whenever convenient</option>
              <option value="normal">Normal — within a few days</option>
              <option value="high">High — as soon as possible</option>
              <option value="emergency">Emergency — right now</option>
            </Select>
            <Input label="Budget max (optional)" type="number" min="0" value={form.budgetMax} onChange={set('budgetMax')} placeholder="₹" />
          </div>
          <Input label="Street address" value={form.line1} onChange={set('line1')} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="City" required value={form.city} onChange={set('city')} />
            <Input label="State" required value={form.state} onChange={set('state')} />
            <Input label="Pincode" required value={form.zip} onChange={set('zip')} placeholder="e.g. 560001" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Preferred date" type="date" value={form.preferredDate} onChange={set('preferredDate')} />
            <Input label="Preferred time window" placeholder="e.g. Morning, 9am–12pm" value={form.preferredTimeWindow} onChange={set('preferredTimeWindow')} />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? <Spinner size={16} className="text-white" /> : (<>Submit & classify with AI <Sparkles size={15} /></>)}
          </Button>
        </form>
      </Card>
    </div>
  );
}
