import { useState, useEffect } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { providers as providersApi, categories as categoriesApi } from '../../lib/endpoints';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Input, Textarea, Spinner } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import { ShieldCheck, FileUp, Star } from 'lucide-react';

export default function ProviderProfile() {
  const { data: profile, loading, reload } = usePoll(() => providersApi.me().then((r) => r.data), []);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [docForm, setDocForm] = useState({ name: '', url: '' });
  const toast = useToast();

  useEffect(() => {
    categoriesApi.list().then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    if (profile && !form) {
      setForm({
        bio: profile.bio || '',
        skills: (profile.skills || []).join(', '),
        categories: (profile.categories || []).map((c) => c._id),
        experienceYears: profile.experienceYears || 0,
        hourlyRate: profile.hourlyRate || 0,
        serviceAreas: (profile.serviceAreas || []).join(', '),
        isOnline: profile.isOnline,
      });
    }
  }, [profile, form]);

  if (loading || !form) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  const toggleCategory = (id) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(id) ? f.categories.filter((c) => c !== id) : [...f.categories, id],
    }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await providersApi.updateMe({
        bio: form.bio,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        categories: form.categories,
        experienceYears: Number(form.experienceYears),
        hourlyRate: Number(form.hourlyRate),
        serviceAreas: form.serviceAreas.split(',').map((s) => s.trim()).filter(Boolean),
        isOnline: form.isOnline,
      });
      toast.success('Profile updated.');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const submitDoc = async (e) => {
    e.preventDefault();
    try {
      await providersApi.addDocument(docForm);
      toast.success('Document submitted for verification.');
      setDocForm({ name: '', url: '' });
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add document.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-navy-900">My profile</h1>
        <StatusBadge status={profile.verificationStatus} />
      </div>

      {profile.ratingCount > 0 && (
        <Card className="p-4 flex items-center gap-2 text-sm">
          <Star size={16} className="text-amber-500 fill-amber-500" />
          <span className="font-medium text-navy-900">{profile.ratingAverage.toFixed(1)}</span>
          <span className="text-muted">({profile.ratingCount} reviews · {profile.completedJobs} jobs completed)</span>
        </Card>
      )}

      <Card className="p-5">
        <form onSubmit={save} className="space-y-4">
          <Textarea label="Bio" rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />

          <div>
            <p className="text-sm font-medium text-navy-900 mb-2">Service categories</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c._id}
                  onClick={() => toggleCategory(c._id)}
                  className={`text-xs px-3 py-1.5 rounded-full border ${
                    form.categories.includes(c._id) ? 'bg-navy-900 text-white border-navy-900' : 'border-gray-300 text-navy-900 hover:bg-gray-50'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <Input label="Skills (comma-separated)" value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} placeholder="plumbing, pipe fitting, leak diagnostics" />
          <Input label="Service areas (comma-separated cities/zips)" value={form.serviceAreas} onChange={(e) => setForm((f) => ({ ...f, serviceAreas: e.target.value }))} />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Years of experience" type="number" min="0" value={form.experienceYears} onChange={(e) => setForm((f) => ({ ...f, experienceYears: e.target.value }))} />
            <Input label="Hourly rate (₹)" type="number" min="0" value={form.hourlyRate} onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))} />
          </div>

          <label className="flex items-center gap-2 text-sm text-navy-900">
            <input type="checkbox" checked={form.isOnline} onChange={(e) => setForm((f) => ({ ...f, isOnline: e.target.checked }))} />
            Currently accepting new jobs
          </label>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? <Spinner size={16} className="text-white" /> : 'Save profile'}
          </Button>
        </form>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-navy-900" />
          <p className="text-sm font-medium text-navy-900">Verification documents</p>
        </div>
        {profile.documents?.length > 0 && (
          <ul className="text-sm text-muted mb-3 space-y-1">
            {profile.documents.map((d, i) => (
              <li key={i}>{d.name}</li>
            ))}
          </ul>
        )}
        <form onSubmit={submitDoc} className="flex gap-2 items-end">
          <Input label="Document name" className="flex-1" value={docForm.name} onChange={(e) => setDocForm((f) => ({ ...f, name: e.target.value }))} placeholder="License, insurance, ID..." />
          <Input label="URL" className="flex-1" value={docForm.url} onChange={(e) => setDocForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." />
          <Button type="submit" variant="outline"><FileUp size={15} /></Button>
        </form>
      </Card>
    </div>
  );
}
