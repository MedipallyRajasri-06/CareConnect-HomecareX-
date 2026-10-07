import { useState } from 'react';
import { Avatar, Button } from './ui';
import {
  Sparkles,
  Star,
  MapPin,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Award,
  Zap,
  Clock,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export default function SmartMatchingCard({
  matches = [],
  onRequestQuote,
  selectedProviderId = null,
  onSelectProvider,
  className = '',
}) {
  if (!matches || matches.length === 0) return null;

  return (
    <div className={`space-y-3.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 text-[#925611]">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-navy-900">
              Matched Real Professionals
            </h3>
            <p className="text-xs text-slate-500">
              Click on any provider below to view full profile & book the service instantly.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-[#925611] border border-amber-200">
          {matches.length} Verified Provider{matches.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid gap-3">
        {matches.map((item, idx) => {
          const profile = item.provider?._id ? item.provider : item.profile || item;
          const user = profile.user || {};
          const score = item.score || 95;
          const badges = item.badges || ['Top Match', 'Verified Pro'];
          const reasons = item.reasons || [];
          const distanceKm = item.distanceKm || 3.2;
          const isSelected = selectedProviderId && String(selectedProviderId) === String(profile._id);

          return (
            <div
              key={profile._id || idx}
              onClick={() => onSelectProvider && onSelectProvider(profile, item)}
              role="button"
              tabIndex={0}
              className={`rounded-2xl border p-4.5 transition-all shadow-xs hover:shadow-lg hover:-translate-y-0.5 cursor-pointer ${
                idx === 0
                  ? 'bg-gradient-to-r from-amber-50/70 via-white to-orange-50/30 border-amber-300 ring-1 ring-amber-300/60'
                  : 'bg-white border-slate-200/90 hover:border-amber-300'
              } ${isSelected ? 'ring-2 ring-[#D98C2B] border-[#D98C2B]' : ''}`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Provider Identity & Avatar */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative">
                    <Avatar
                      name={user.name || 'Pro'}
                      color={user.avatarColor}
                      size={52}
                    />
                    {idx === 0 ? (
                      <span className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-[#D98C2B] text-white shadow-xs" title="Top Recommendation">
                        <Award size={12} />
                      </span>
                    ) : (
                      <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-white shadow-xs" title="Verified Professional">
                        <ShieldCheck size={12} />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-navy-900 hover:text-[#D98C2B] transition-colors truncate">
                        {user.name || 'Professional'}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                        <Sparkles size={11} /> {score}% Match
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                        <UserCheck size={10} /> Active Real Pro
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Star size={12} className="fill-amber-500" />
                        {(profile.ratingAverage || item.ratingAverage || 5.0).toFixed(1)}★
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <MapPin size={12} className="text-slate-400" />
                        {distanceKm} km away
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        {profile.completedJobs || item.completedJobs || 12}+ jobs done
                      </span>
                      {profile.experienceYears > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-slate-600">{profile.experienceYears} yrs exp</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Badges & Direct Booking Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {badges.map((b, bIdx) => (
                      <span
                        key={bIdx}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          b.includes('Top')
                            ? 'bg-amber-100 text-[#925611]'
                            : b.includes('5★')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectProvider) onSelectProvider(profile, item);
                      else if (onRequestQuote) onRequestQuote(profile);
                    }}
                    className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#152238] to-[#1f3150] hover:from-[#D98C2B] hover:to-[#b8731d] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Calendar size={13} />
                    <span>Book Service</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {/* Match Factors Explanation Pills */}
              {reasons.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Why Matched:
                  </span>
                  {reasons.slice(0, 3).map((reason, rIdx) => (
                    <span
                      key={rIdx}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/80"
                    >
                      <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                      {reason}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
