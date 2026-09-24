import React from 'react';

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_12px_-4px_rgba(15,23,42,0.04)] ${
        hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_rgba(15,23,42,0.08)] hover:border-slate-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

const ACCENT_STYLES = {
  navy: {
    border: 'border-l-navy-900',
    iconBg: 'bg-navy-900/5 text-navy-900',
    indicator: 'bg-navy-900',
  },
  amber: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-500/10 text-amber-600',
    indicator: 'bg-amber-500',
  },
  green: {
    border: 'border-l-green-600',
    iconBg: 'bg-green-600/10 text-green-600',
    indicator: 'bg-green-600',
  },
  red: {
    border: 'border-l-red-600',
    iconBg: 'bg-red-600/10 text-red-600',
    indicator: 'bg-red-600',
  },
  blue: {
    border: 'border-l-blue-600',
    iconBg: 'bg-blue-600/10 text-blue-600',
    indicator: 'bg-blue-600',
  },
  indigo: {
    border: 'border-l-indigo-600',
    iconBg: 'bg-indigo-600/10 text-indigo-600',
    indicator: 'bg-indigo-600',
  },
};

export function StatTile({ label, value, accent = 'navy', icon: Icon, sub, trend }) {
  const style = ACCENT_STYLES[accent] || ACCENT_STYLES.navy;
  return (
    <div className={`bg-white border border-slate-200/80 border-l-[5px] ${style.border} rounded-2xl p-4 sm:p-5 shadow-[0_2px_10px_-3px_rgba(15,23,42,0.03)] hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
        {Icon && (
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${style.iconBg}`}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <p className="font-display text-2xl sm:text-3xl font-bold text-navy-900 mt-2 tracking-tight">{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted">
          {trend && (
            <span className="inline-flex items-center font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-[11px]">
              {trend}
            </span>
          )}
          {sub && <span className="truncate">{sub}</span>}
        </div>
      )}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-medium',
    md: 'px-4 py-2.5 text-sm font-medium',
    lg: 'px-6 py-3 text-base font-semibold',
  };

  const variants = {
    primary:
      'bg-navy-900 text-white hover:bg-navy-800 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.3)] hover:shadow-[0_4px_14px_-2px_rgba(15,23,42,0.4)]',
    amber:
      'bg-amber-500 text-navy-950 font-semibold hover:bg-amber-400 shadow-[0_2px_10px_-2px_rgba(245,158,11,0.4)] hover:shadow-[0_4px_16px_-2px_rgba(245,158,11,0.5)]',
    blue:
      'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_2px_10px_-2px_rgba(37,99,235,0.35)]',
    outline:
      'border border-slate-300 text-navy-900 bg-white hover:bg-slate-50 hover:border-slate-400 shadow-sm',
    ghost:
      'text-navy-900 hover:bg-slate-100/80',
    danger:
      'bg-red-600 text-white hover:bg-red-700 shadow-[0_2px_8px_-2px_rgba(239,68,68,0.35)]',
    subtle:
      'bg-slate-100 text-navy-900 hover:bg-slate-200/80',
  };

  return (
    <button
      className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size={16} className="shrink-0 text-current" /> : null}
      {children}
    </button>
  );
}

export function Input({ label, error, helper, className = '', icon: Icon, ...props }) {
  return (
    <label className="block w-full text-left">
      {label && <span className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">{label}</span>}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-muted pointer-events-none flex items-center">
            <Icon size={16} />
          </div>
        )}
        <input
          className={`w-full rounded-xl border border-slate-300/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none shadow-xs disabled:bg-slate-50 disabled:text-slate-500 ${
            Icon ? 'pl-10' : ''
          } ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs font-medium text-red-600 mt-1.5 block">{error}</span>}
      {helper && !error && <span className="text-xs text-muted mt-1.5 block">{helper}</span>}
    </label>
  );
}

export function Textarea({ label, error, helper, className = '', ...props }) {
  return (
    <label className="block w-full text-left">
      {label && <span className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">{label}</span>}
      <textarea
        className={`w-full rounded-xl border border-slate-300/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-150 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none shadow-xs disabled:bg-slate-50 ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs font-medium text-red-600 mt-1.5 block">{error}</span>}
      {helper && !error && <span className="text-xs text-muted mt-1.5 block">{helper}</span>}
    </label>
  );
}

export function Select({ label, error, helper, children, className = '', ...props }) {
  return (
    <label className="block w-full text-left">
      {label && <span className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">{label}</span>}
      <div className="relative">
        <select
          className={`w-full rounded-xl border border-slate-300/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-all duration-150 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none shadow-xs appearance-none pr-9 ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <span className="text-xs font-medium text-red-600 mt-1.5 block">{error}</span>}
      {helper && !error && <span className="text-xs text-muted mt-1.5 block">{helper}</span>}
    </label>
  );
}

export function Spinner({ size = 20, className = '' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function EmptyState({ title, message, action, icon: Icon }) {
  return (
    <div className="text-center py-14 px-6">
      {Icon && (
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-100/90 text-slate-500 mb-3.5 shadow-inner">
          <Icon size={26} />
        </div>
      )}
      <h3 className="font-display font-semibold text-lg text-navy-900">{title}</h3>
      {message && <p className="text-sm text-muted mt-1.5 max-w-sm mx-auto leading-relaxed">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Avatar({ name, color = '#2563eb', size = 32 }) {
  const initials = (name || '?')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm border border-white/20 select-none"
      style={{
        background: `linear-gradient(135deg, ${color}, #0f172a)`,
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.38),
      }}
    >
      {initials}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full ${
          widths[size] || widths.md
        } max-h-[90vh] overflow-y-auto flex flex-col z-10 animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100">
          <h3 className="font-display font-bold text-lg text-navy-900">{title}</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="p-6 flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'neutral', className = '' }) {
  const styles = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    green: 'bg-green-50 text-green-800 border-green-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[variant] || styles.neutral
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value = 0, max = 100, color = 'amber', className = '' }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    amber: 'bg-amber-500',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
    indigo: 'bg-indigo-600',
  };
  return (
    <div className={`w-full bg-slate-100 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${colors[color] || colors.amber}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
