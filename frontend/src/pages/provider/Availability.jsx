import { useState } from 'react';
import { usePoll } from '../../hooks/usePoll';
import { providers as providersApi } from '../../lib/endpoints';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Input, EmptyState, Spinner } from '../../components/ui';
import { CalendarClock, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function ProviderAvailability() {
  const { data: profile, loading, reload } = usePoll(() => providersApi.me().then((r) => r.data), []);
  const [form, setForm] = useState({ date: '', start: '', end: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const addSlot = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await providersApi.addSlots([{ date: form.date, startTime: form.start, endTime: form.end }]);
      toast.success('Availability slot added.');
      setForm({ date: '', start: '', end: '' });
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add slot.');
    } finally {
      setSaving(false);
    }
  };

  const removeSlot = async (slotId) => {
    try {
      await providersApi.removeSlot(slotId);
      toast.success('Slot removed.');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove slot.');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  const slots = [...(profile?.availability || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900">Availability</h1>
        <p className="text-sm text-muted mt-0.5">
          The availability engine automatically prevents overlapping bookings on the same date.
        </p>
      </div>

      <Card className="p-5">
        <p className="text-sm font-medium text-navy-900 mb-3">Add a time slot</p>
        <form onSubmit={addSlot} className="grid sm:grid-cols-4 gap-3 items-end">
          <Input label="Date" type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <Input label="Start" type="time" required value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} />
          <Input label="End" type="time" required value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} />
          <Button type="submit" disabled={saving}>
            {saving ? <Spinner size={16} className="text-white" /> : (<><Plus size={15} /> Add</>)}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-display font-semibold text-sm text-navy-900">Your slots</h2>
        </div>
        {slots.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No availability set" message="Add slots so customers can book you." />
        ) : (
          <div className="divide-y divide-gray-100">
            {slots.map((s) => (
              <div key={s._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-navy-900">
                    {s.date ? format(new Date(s.date), 'EEE, MMM d, yyyy') : `Recurring: day ${s.dayOfWeek}`}
                  </p>
                  <p className="text-xs text-muted">{s.startTime} – {s.endTime}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.isBooked ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                    {s.isBooked ? 'Booked' : 'Open'}
                  </span>
                  {!s.isBooked && (
                    <button onClick={() => removeSlot(s._id)} className="text-gray-400 hover:text-red-600" aria-label="Remove slot">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
