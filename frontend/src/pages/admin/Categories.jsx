import { useState } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { categories as categoriesApi } from '../../lib/endpoints';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Input, Textarea, Modal, Spinner, EmptyState } from '../../components/ui';
import { Tags, Plus, Pencil, Trash2 } from 'lucide-react';

const emptyForm = { name: '', description: '', icon: 'wrench', keywords: '', requiredSkills: '', basePrice: '', pricingUnit: 'flat', surgeMultiplier: 1 };

export default function AdminCategories() {
  const { data, loading, reload } = usePoll(() => categoriesApi.list({ includeInactive: true }).then((r) => r.data), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name, description: c.description, icon: c.icon,
      keywords: (c.keywords || []).join(', '), requiredSkills: (c.requiredSkills || []).join(', '),
      basePrice: c.basePrice, pricingUnit: c.pricingUnit, surgeMultiplier: c.surgeMultiplier,
    });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      icon: form.icon,
      keywords: form.keywords.split(',').map((s) => s.trim()).filter(Boolean),
      requiredSkills: form.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
      basePrice: Number(form.basePrice) || 0,
      pricingUnit: form.pricingUnit,
      surgeMultiplier: Number(form.surgeMultiplier) || 1,
    };
    try {
      if (editing) {
        await categoriesApi.update(editing._id, payload);
        toast.success('Category updated.');
      } else {
        await categoriesApi.create(payload);
        toast.success('Category created.');
      }
      setModalOpen(false);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save category.');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (id) => {
    try {
      await categoriesApi.remove(id);
      toast.success('Category deactivated.');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not deactivate.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900">Categories & pricing</h1>
          <p className="text-sm text-muted mt-0.5">Manage service categories, AI keywords, and pricing policies.</p>
        </div>
        <Button onClick={openCreate}><Plus size={15} /> New category</Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-10 flex justify-center"><Spinner /></div>
        ) : data.length === 0 ? (
          <EmptyState icon={Tags} title="No categories yet" message="Create your first service category." />
        ) : (
          <div className="divide-y divide-gray-100">
            {data.map((c) => (
              <div key={c._id} className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-navy-900">{c.name}</p>
                    {!c.isActive && <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>}
                  </div>
                  <p className="text-xs text-muted mt-0.5 max-w-lg truncate">{c.description}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    ₹{c.basePrice} {c.pricingUnit} · surge ×{c.surgeMultiplier} · keywords: {(c.keywords || []).slice(0, 4).join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-navy-900" aria-label="Edit"><Pencil size={15} /></button>
                  {c.isActive && (
                    <button onClick={() => deactivate(c._id)} className="p-2 text-gray-400 hover:text-red-600" aria-label="Deactivate"><Trash2 size={15} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit category' : 'New category'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Spinner size={16} className="text-white" /> : 'Save'}</Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4">
          <Input label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Textarea label="Description" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Input
            label="AI keywords (comma-separated — used to auto-classify free-text requests)"
            value={form.keywords}
            onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
            placeholder="leak, pipe, faucet, drain"
          />
          <Input
            label="Required skills (comma-separated)"
            value={form.requiredSkills}
            onChange={(e) => setForm((f) => ({ ...f, requiredSkills: e.target.value }))}
          />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Base price (₹)" type="number" min="0" value={form.basePrice} onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))} />
            <label className="block">
              <span className="block text-sm font-medium text-navy-900 mb-1">Pricing unit</span>
              <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.pricingUnit} onChange={(e) => setForm((f) => ({ ...f, pricingUnit: e.target.value }))}>
                <option value="flat">Flat</option>
                <option value="hourly">Hourly</option>
              </select>
            </label>
            <Input label="Surge multiplier" type="number" step="0.1" min="1" value={form.surgeMultiplier} onChange={(e) => setForm((f) => ({ ...f, surgeMultiplier: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
