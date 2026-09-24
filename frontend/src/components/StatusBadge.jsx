const STYLES = {
  submitted: { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400' },
  classified: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-600' },
  matching: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', live: true },
  quoted: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  awaiting_selection: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', live: true },
  scheduled: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-600' },
  in_progress: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', live: true },
  completed: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-600' },
  cancelled: { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-500', dot: 'bg-slate-400' },
  disputed: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-600', live: true },
  pending: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' },
  accepted: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-600' },
  declined: { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-500', dot: 'bg-slate-400' },
  expired: { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-500', dot: 'bg-slate-400' },
  withdrawn: { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-500', dot: 'bg-slate-400' },
  verified: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-600' },
  rejected: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-600' },
  open: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-600', live: true },
  investigating: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', live: true },
  resolved: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-600' },
  paid: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-600' },
  refunded: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-600' },
  void: { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-500', dot: 'bg-slate-400' },
};

const LABELS = {
  in_progress: 'In progress',
  awaiting_selection: 'Awaiting quote selection',
};

export default function StatusBadge({ status, className = '' }) {
  const s = STYLES[status] || STYLES.submitted;
  const label = LABELS[status] || status?.replace(/_/g, ' ');
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide capitalize border shadow-2xs select-none ${s.bg} ${s.border} ${s.text} ${className}`}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.dot} ${s.live ? 'pulse-dot' : ''}`} />
      {label}
    </span>
  );
}
