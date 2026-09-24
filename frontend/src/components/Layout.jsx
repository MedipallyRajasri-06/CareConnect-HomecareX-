import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, CalendarClock, User, Wrench, Users,
  Tags, ShieldCheck, AlertTriangle, ScrollText, LogOut, Home, Menu, X,
  Sparkles, ExternalLink, Activity, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';
import NotificationBell from './NotificationBell';

const NAV_BY_ROLE = {
  customer: [
    { to: '/customer', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/customer/new-request', label: 'Request a service', icon: ClipboardList },
    { to: '/customer/requests', label: 'My requests', icon: ScrollText },
    { to: '/customer/bookings', label: 'My bookings', icon: CalendarClock },
  ],
  provider: [
    { to: '/provider', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/provider/requests', label: 'Matched requests', icon: ClipboardList },
    { to: '/provider/jobs', label: 'My jobs', icon: Wrench },
    { to: '/provider/reviews', label: 'My reviews', icon: Star },
    { to: '/provider/disputes', label: 'Disputes', icon: AlertTriangle },
    { to: '/provider/availability', label: 'Availability', icon: CalendarClock },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/categories', label: 'Categories & pricing', icon: Tags },
    { to: '/admin/providers', label: 'Providers', icon: ShieldCheck },
    { to: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/audit-log', label: 'Audit log', icon: ScrollText },
  ],
  operations_manager: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/categories', label: 'Categories & pricing', icon: Tags },
    { to: '/admin/providers', label: 'Providers', icon: ShieldCheck },
    { to: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
    { to: '/admin/audit-log', label: 'Audit log', icon: ScrollText },
  ],
  support_agent: [
    { to: '/support', label: 'Disputes queue', icon: AlertTriangle, end: true },
  ],
};

const ROLE_LABELS = {
  admin: 'Platform Admin',
  operations_manager: 'Operations Manager',
  provider: 'Service Provider',
  customer: 'Customer',
  support_agent: 'Support Agent',
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV_BY_ROLE[user?.role] || [];

  const currentItem = items.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-68 bg-[#FFFFFF] text-[#152238] flex flex-col shrink-0 border-r border-[#E5E7EB] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-[#E5E7EB]">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img
              src="/homecarex-logo.png"
              alt="HomeCareX"
              className="h-9 w-9 rounded-lg object-contain bg-[#F8F9FA] p-0.5 border border-slate-200 shadow-xs group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center leading-tight">
                <span className="font-display font-bold text-lg tracking-tight text-[#152238]">
                  HomeCare
                </span>
                <span className="font-display font-bold text-lg tracking-tight text-[#2F8F5B]">
                  X
                </span>
              </div>
              <span className="text-[10px] text-[#5B6472] tracking-wider uppercase font-semibold block">
                Pro Operations
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-500 hover:text-[#152238] p-1 rounded-lg hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#5B6472]">
            Navigation
          </div>
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#FBEAD2] text-[#D98C2B] font-semibold border-l-4 border-[#D98C2B] shadow-xs'
                    : 'text-[#152238] hover:text-[#D98C2B] hover:bg-[#F0F1F3]'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer User Info */}
        <div className="p-3 border-t border-[#E5E7EB] bg-[#F8F9FA]">
          {user?.role === 'provider' ? (
            <Link
              to="/provider/profile"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-150 mb-2 group cursor-pointer ${
                location.pathname === '/provider/profile'
                  ? 'bg-[#FBEAD2] border-[#D98C2B] shadow-xs ring-2 ring-[#D98C2B]/30'
                  : 'bg-white border-[#E5E7EB] hover:border-[#D98C2B] hover:shadow-xs'
              }`}
              title="Click to view & edit My Profile"
            >
              <div className="relative shrink-0">
                <Avatar name={user?.name} color={user?.avatarColor} size={36} />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#152238] group-hover:text-[#D98C2B] transition-colors truncate">
                    {user?.name}
                  </p>
                  <User size={13} className="text-slate-400 group-hover:text-[#D98C2B] transition-colors shrink-0 ml-1" />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block text-[10px] font-medium text-[#925611] bg-[#FBEAD2] px-1.5 py-0.5 rounded truncate max-w-full">
                    My Profile
                  </span>
                  <span className="text-[10px] text-slate-500 group-hover:text-[#D98C2B] transition-colors">
                    Edit →
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-[#E5E7EB] shadow-xs mb-2">
              <Avatar name={user?.name} color={user?.avatarColor} size={36} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#152238] truncate">{user?.name}</p>
                <span className="inline-block text-[10px] font-medium text-[#925611] bg-[#FBEAD2] px-1.5 py-0.5 rounded mt-0.5 truncate max-w-full">
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-red-600 w-full rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
              aria-label="Open menu"
            >
              <Menu size={19} />
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs font-medium text-muted">
                {ROLE_LABELS[user?.role]} /
              </span>
              <span className="text-sm font-semibold text-navy-900">
                {currentItem?.label || (location.pathname.startsWith('/provider/profile') ? 'My profile' : 'Overview')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live System Status Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot" />
              <span>AI Dispatch Active</span>
            </div>

            <NotificationBell />
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
