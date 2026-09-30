import { useState } from 'react';
import { bookings as bookingsApi } from '../lib/endpoints';
import { useToast } from '../context/ToastContext';
import { Card, Button, Modal, Textarea, Select, Spinner } from './ui';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  RotateCcw,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function WarrantyCard({ booking, onClaimSubmitted, className = '' }) {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    reason: '',
    issueType: 'revisit',
    preferredDate: '',
    note: '',
  });

  const now = new Date();
  const completedDate = booking.customerConfirmedAt || booking.updatedAt || booking.scheduledDate;
  const warrantyDays = booking.warranty?.days || 30;
  const expiresAt = booking.warranty?.expiresAt
    ? new Date(booking.warranty.expiresAt)
    : new Date(new Date(completedDate).getTime() + warrantyDays * 24 * 60 * 60 * 1000);

  const daysLeft = Math.max(0, differenceInDays(expiresAt, now));
  const isExpired = daysLeft <= 0;
  const claims = booking.warranty?.claims || [];

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) {
      toast.error('Please describe why you need a warranty revisit.');
      return;
    }

    setSubmitting(true);
    try {
      await bookingsApi.claimWarranty(booking._id, {
        reason: form.reason.trim(),
        issueType: form.issueType,
        preferredDate: form.preferredDate || undefined,
        note: form.note.trim(),
      });
      toast.success('Warranty revisit request submitted! We will coordinate your free visit.');
      setModalOpen(false);
      setForm({ reason: '', issueType: 'revisit', preferredDate: '', note: '' });
      onClaimSubmitted?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit warranty claim.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={`rounded-2xl border p-5 transition-all shadow-sm ${
          isExpired
            ? 'bg-slate-50 border-slate-200'
            : 'bg-gradient-to-br from-[#F8FAF8] via-white to-[#F2F8F4] border-emerald-200'
        } ${className}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                isExpired
                  ? 'bg-slate-100 text-slate-500'
                  : 'bg-emerald-100/80 text-emerald-700 shadow-xs'
              }`}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-sm text-navy-900">
                  CareConnect 30-Day Service Warranty
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isExpired
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isExpired ? 'Expired' : 'Active Guarantee'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isExpired
                  ? `Warranty period concluded on ${format(expiresAt, 'MMM d, yyyy')}.`
                  : `Protected until ${format(expiresAt, 'MMM d, yyyy')} (${daysLeft} day${
                      daysLeft === 1 ? '' : 's'
                    } remaining). Any recurrence is covered 100% free.`}
              </p>
            </div>
          </div>

          {!isExpired && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs hover:shadow cursor-pointer select-none"
            >
              <RotateCcw size={14} />
              <span>Claim Free Revisit</span>
            </button>
          )}
        </div>

        {/* Previous Warranty Claims Log */}
        {claims.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-emerald-100 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Warranty Claims ({claims.length})
            </p>
            <div className="space-y-2">
              {claims.map((c, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white border border-emerald-100 flex items-center justify-between text-xs shadow-2xs"
                >
                  <div>
                    <span className="font-semibold text-navy-900">{c.reason}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Requested {format(new Date(c.createdAt), 'MMM d, yyyy')} · {c.costType === 'free' ? '100% Free Revisit' : 'Reduced Cost'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Claim Warranty Revisit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Request Free Warranty Revisit"
        footer={null}
      >
        <form onSubmit={handleClaim} className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <Sparkles size={16} className="text-emerald-600 shrink-0" />
            <span>
              Under our 30-Day Satisfaction Warranty, revisits for issues related to this service are provided at <strong>zero extra charge</strong>.
            </span>
          </div>

          <Select
            label="Issue Type"
            value={form.issueType}
            onChange={(e) => setForm((f) => ({ ...f, issueType: e.target.value }))}
          >
            <option value="revisit">Problem has recurred</option>
            <option value="incomplete">Incomplete repair or adjustment needed</option>
            <option value="workmanship">Workmanship check requested</option>
            <option value="other">Other related issue</option>
          </Select>

          <Textarea
            label="Explain what issue you are experiencing *"
            required
            rows={3}
            placeholder="e.g. The leak in the kitchen pipe returned this morning when running water."
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Preferred Revisit Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={form.preferredDate}
                onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#D98C2B] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Access / Gate Instructions
              </label>
              <input
                type="text"
                placeholder="e.g. Ring flat 402 buzzer"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#D98C2B] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !form.reason.trim()} className="bg-emerald-600 hover:bg-emerald-700">
              {submitting ? <Spinner size={16} className="text-white" /> : 'Confirm Free Revisit Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
