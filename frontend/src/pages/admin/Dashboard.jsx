import { usePoll } from '../../hooks/usePoll';
import { analytics as analyticsApi } from '../../lib/endpoints';
import { Card, StatTile, Spinner } from '../../components/ui';
import { Users, ShieldCheck, ClipboardList, Wrench, IndianRupee, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const STATUS_COLORS = {
  submitted: '#9ca3af', classified: '#2b6cd9', matching: '#d98c2b', quoted: '#d98c2b',
  awaiting_selection: '#d98c2b', scheduled: '#2b6cd9', in_progress: '#d98c2b',
  completed: '#2f8f5b', cancelled: '#9ca3af', disputed: '#c0392b',
};

export default function AdminDashboard() {
  const { data, loading } = usePoll(() => analyticsApi.overview().then((r) => r.data), [], 15000);

  if (loading || !data) return <div className="flex justify-center py-16"><Spinner size={28} /></div>;

  const { totals, requestsByStatus, bookingsByCategory, trend } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900">Platform overview</h1>
        <p className="text-sm text-muted mt-0.5">Live operational metrics across HomeCareX.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile label="Customers" value={totals.customers} accent="navy" icon={Users} />
        <StatTile label="Providers" value={totals.providers} sub={`${totals.verifiedProviders} verified`} accent="blue" icon={ShieldCheck} />
        <StatTile label="Active requests" value={totals.activeRequests} accent="amber" icon={ClipboardList} />
        <StatTile label="Bookings" value={totals.bookings} sub={`${totals.completedBookings} completed`} accent="navy" icon={Wrench} />
        <StatTile label="Revenue" value={`₹${totals.revenue.toFixed(0)}`} accent="green" icon={IndianRupee} />
        <StatTile label="Open disputes" value={totals.openDisputes} accent="red" icon={AlertTriangle} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-display font-semibold text-sm text-navy-900 mb-4">Requests submitted (last 14 days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#152238" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h2 className="font-display font-semibold text-sm text-navy-900 mb-4">Requests by status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={requestsByStatus} dataKey="count" nameKey="_id" innerRadius={45} outerRadius={80} paddingAngle={2}>
                {requestsByStatus.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry._id] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="font-display font-semibold text-sm text-navy-900 mb-4">Bookings & revenue by category</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bookingsByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#d98c2b" radius={[4, 4, 0, 0]} name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
