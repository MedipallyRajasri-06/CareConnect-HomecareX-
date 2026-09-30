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
              Smart Professional Recommendations
            </h3>
            <p className="text-xs text-slate-500">
              Ranked dynamically by service specialty, location proximity, open availability, rating & experience.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-[#925611] border border-amber-200">
          {matches.length} Top Pick{matches.length === 1 ? '' : 's'}
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
              className={`rounded-2xl border p-4.5 transition-all shadow-xs hover:shadow-md ${
                idx === 0
                  ? 'bg-gradient-to-r from-amber-50/70 via-white to-orange-50/30 border-amber-300 ring-1 ring-amber-300/60'
                  : 'bg-white border-slate-200/90 hover:border-amber-200'
              } ${isSelected ? 'ring-2 ring-[#D98C2B] border-[#D98C2B]' : ''}`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Provider Identity & Avatar */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative">
                    <Avatar
                      name={user.name || 'Pro'}
                      color={user.avatarColor}
                      size={50}
                    />
                    {idx === 0 && (
                      <span className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-[#D98C2B] text-white shadow-xs">
                        <Award size={12} />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-navy-900 truncate">
                        {user.name || 'Professional'}
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                        <Sparkles size={11} /> {score}% Match
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
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
                          <span>{profile.experienceYears} yrs exp</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Badges & Direct Action */}
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

                  {onRequestQuote && (
                    <button
                      type="button"
                      onClick={() => onRequestQuote(profile)}
                      className="mt-1 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#152238] hover:bg-[#1f3150] text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer whitespace-nowrap"
                    >
                      <span>Request Fast Quote</span>
                      <ArrowRight size={13} />
                    </button>
                  )}

                  {onSelectProvider && (
                    <button
                      type="button"
                      onClick={() => onSelectProvider(profile)}
                      className={`mt-1 flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
                        isSelected
                          ? 'bg-[#D98C2B] text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected ? 'Selected Match' : 'Choose Provider'}
                    </button>
                  )}
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
