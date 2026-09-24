import { Link } from 'react-router-dom';
import { usePoll } from '../../hooks/usePoll';
import { analytics as analyticsApi, requests as requestsApi, bookings as bookingsApi, providers as providersApi } from '../../lib/endpoints';
import { Card, StatTile, EmptyState, Spinner } from '../../components/ui';
import StatusBadge from '../../components/StatusBadge';
import { Wrench, IndianRupee, Star, ClipboardList, ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default function ProviderDashboard() {
  const { data: stats, loading: statsLoading } = usePoll(() => analyticsApi.provider().then((r) => r.data), []);
  const { data: profile } = usePoll(() => providersApi.me().then((r) => r.data), []);
  const { data: reqData, loading: reqLoading } = usePoll(() => requestsApi.list({ limit: 5 }), []);
  const { data: jobData, loading: jobLoading } = usePoll(() => bookingsApi.list({ limit: 5 }), []);

  const matches = reqData?.data || [];
  const jobs = jobData?.data || [];
  const isProfileIncomplete = profile && (!profile.categories || profile.categories.length === 0 || !profile.skills || profile.skills.length === 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900">Overview</h1>
        <p className="text-sm text-muted mt-0.5">Your job matches, active work, and performance at a glance.</p>
      </div>

      {isProfileIncomplete && (
        <Card className="p-4 sm:p-5 border-l-4 border-l-[#D98C2B] bg-[#FFF8EE] border border-[#F3DFC1] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#D98C2B]/15 text-[#D98C2B] rounded-lg shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#152238]">
                Complete your profile to start receiving job matches
              </h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Your profile is missing {!profile.categories?.length ? 'service categories' : ''}{!profile.categories?.length && !profile.skills?.length ? ' and ' : ''}{!profile.skills?.length ? 'skills' : ''}. You will not appear in customer searches or AI job matches until these are configured.
              </p>
            </div>
          </div>
          <Link
            to="/provider/profile"
            className="inline-flex items-center gap-1.5 shrink-0 px-4 py-2 bg-[#D98C2B] hover:bg-[#c27b22] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors text-center"
          >
            Complete Profile <ArrowRight size={14} />
          </Link>
        </Card>
      )}

      {profile && profile.verificationStatus !== 'verified' && (
        <Card className="p-4 border-l-4 border-l-amber-500 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-navy-900">
                Verification status: <span className="capitalize font-semibold">{profile.verificationStatus}</span>
              </p>
              <p className="text-xs text-muted mt-0.5">
                {profile.verificationStatus === 'pending'
                  ? 'Your profile is awaiting admin approval. Only verified providers receive job matches and can submit quotes.'
                  : `Your verification was rejected: ${profile.verificationNotes || 'Please update your documents and profile.'}`}
              </p>
            </div>
          </div>
          <Link to="/provider/profile" className="text-xs font-medium text-amber-700 hover:underline shrink-0">
            Review Documents & Profile →
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Total jobs" value={statsLoading ? '—' : stats?.totalBookings ?? 0} accent="navy" icon={Wrench} />
        <StatTile label="Completed" value={statsLoading ? '—' : stats?.completed ?? 0} accent="green" icon={ClipboardList} />
        <StatTile label="Earnings" value={statsLoading ? '—' : `₹${stats?.earnings ?? 0}`} accent="amber" icon={IndianRupee} />
        <StatTile label="Rating" value={statsLoading ? '—' : (stats?.rating ? stats.rating.toFixed(1) : '—')} sub={stats?.ratingCount ? `${stats.ratingCount} reviews` : ''} accent="blue" icon={Star} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-display font-semibold text-navy-900 text-sm">AI-matched requests</h2>
            <Link to="/provider/requests" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {reqLoading ? (
            <div className="p-8 flex justify-center"><Spinner /></div>
          ) : matches.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No matches yet" message="New requests matching your skills will show up here." />
          ) : (
            <div className="divide-y divide-gray-100">
              {matches.map((r) => (
                <Link key={r._id} to={`/provider/requests/${r._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{r.category?.name}</p>
                    <p className="text-xs text-muted truncate mt-0.5">{r.rawDescription}</p>
                  </div>
                  <StatusBadge status={r.status} className="shrink-0 ml-3" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-display font-semibold text-navy-900 text-sm">My jobs</h2>
            <Link to="/provider/jobs" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          {jobLoading ? (
            <div className="p-8 flex justify-center"><Spinner /></div>
          ) : jobs.length === 0 ? (
            <EmptyState icon={Wrench} title="No jobs yet" message="Accepted bookings will appear here." />
          ) : (
            <div className="divide-y divide-gray-100">
              {jobs.map((b) => (
                <Link key={b._id} to={`/provider/jobs/${b._id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{b.category?.name}</p>
                    <p className="text-xs text-muted mt-0.5">{format(new Date(b.scheduledDate), 'MMM d')} · {b.scheduledStartTime}</p>
                  </div>
                  <StatusBadge status={b.status} className="shrink-0 ml-3" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
