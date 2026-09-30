import { useState, useEffect } from 'react';
import { bookings as bookingsApi } from '../lib/endpoints';
import { useToast } from '../context/ToastContext';
import { Avatar, Button, Spinner } from './ui';
import StatusBadge from './StatusBadge';
import {
  Navigation,
  MapPin,
  Clock,
  Car,
  ShieldCheck,
  Phone,
  MessageSquare,
  Sparkles,
  CheckCircle,
  PlayCircle,
  Radio,
} from 'lucide-react';

const STATUS_STEPS = [
  { key: 'scheduled', label: 'Assigned', desc: 'Professional assigned' },
  { key: 'on_the_way', label: 'On the Way', desc: 'En route with tools' },
  { key: 'arrived', label: 'Arrived', desc: 'At your doorstep' },
  { key: 'in_progress', label: 'In Progress', desc: 'Service ongoing' },
  { key: 'completed', label: 'Completed', desc: 'Work inspected & guaranteed' },
];

export default function LiveTrackingCard({
  booking,
  isProvider = false,
  onStatusUpdated,
  onOpenChat,
  onOpenCall,
  className = '',
}) {
  const toast = useToast();
  const [updating, setUpdating] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(
    booking.status === 'on_the_way' ? 45 : booking.status === 'arrived' ? 95 : 15
  );

  // Animate moving vehicle marker along simulated route if "on_the_way"
  useEffect(() => {
    if (booking.status === 'on_the_way') {
      const interval = setInterval(() => {
        setAnimatedProgress((prev) => {
          if (prev >= 90) return 40;
          return prev + 2.5;
        });
      }, 1500);
      return () => clearInterval(interval);
    } else if (booking.status === 'arrived' || booking.status === 'in_progress' || booking.status === 'completed') {
      setAnimatedProgress(98);
    } else {
      setAnimatedProgress(15);
    }
  }, [booking.status]);

  const handleProviderStatusChange = async (nextStatus) => {
    setUpdating(true);
    try {
      await bookingsApi.updateStatus(booking._id, {
        status: nextStatus,
        estimatedArrivalMins: nextStatus === 'on_the_way' ? 12 : nextStatus === 'arrived' ? 0 : undefined,
        distanceKm: nextStatus === 'on_the_way' ? 2.8 : nextStatus === 'arrived' ? 0 : undefined,
      });
      toast.success(`Status updated to "${nextStatus.replace('_', ' ')}"!`);
      onStatusUpdated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === booking.status);
  const activeIdx = currentStepIdx >= 0 ? currentStepIdx : 0;
  const isEnRoute = booking.status === 'on_the_way';
  const isArrived = booking.status === 'arrived';

  // Calculate coordinates along an SVG curve (x, y) based on animatedProgress (0 - 100)
  const markerX = 50 + (animatedProgress / 100) * 380;
  const markerY = 120 - Math.sin((animatedProgress / 100) * Math.PI) * 45;

  const otherUser = isProvider ? booking.customer : booking.provider?.user;
  const otherRole = isProvider ? 'Customer' : 'Professional';

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-slate-100 bg-[#FBFBFC] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-100 text-[#925611]">
            <Navigation size={18} className={isEnRoute ? 'animate-spin' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-navy-900">Live Professional Tracking</h3>
              {isEnRoute && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live GPS
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Real-time dispatch & arrival status for Booking #{booking._id?.toString().slice(-6)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenCall && (
            <button
              type="button"
              onClick={onOpenCall}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <Phone size={14} className="text-emerald-600" />
              <span>Masked Call</span>
            </button>
          )}
          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#152238] hover:bg-[#1f3150] text-white transition-colors cursor-pointer"
            >
              <MessageSquare size={14} className="text-amber-400" />
              <span>Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Map Visualizer Canvas */}
      <div className="relative h-60 w-full bg-[#E5E9F0] overflow-hidden select-none">
        {/* Background Street Grid Simulation */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D8DEE9" strokeWidth="1" />
            </pattern>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#D98C2B" />
            </linearGradient>
          </defs>

          {/* Map Base Pattern */}
          <rect width="100%" height="100%" fill="#EEF2F6" />
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Road Network Lines */}
          <path d="M 0 60 Q 200 80 500 50" fill="none" stroke="#CBD5E1" strokeWidth="16" />
          <path d="M 120 0 L 140 240" fill="none" stroke="#CBD5E1" strokeWidth="12" />
          <path d="M 320 0 L 310 240" fill="none" stroke="#CBD5E1" strokeWidth="14" />
          <path d="M 0 180 Q 250 140 500 190" fill="none" stroke="#CBD5E1" strokeWidth="14" />

          {/* Active Route Path */}
          <path
            d="M 50 120 Q 240 60 430 120"
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="5"
            strokeDasharray="6 4"
            className="animate-pulse"
          />

          {/* Origin Base Pin (Provider Base) */}
          <g transform="translate(50, 120)">
            <circle r="7" fill="#2563EB" />
            <circle r="12" fill="#2563EB" fillOpacity="0.25" />
          </g>

          {/* Customer Home Pin */}
          <g transform="translate(430, 120)">
            <circle r="16" fill="#D98C2B" fillOpacity="0.2" className="animate-ping" />
            <circle r="9" fill="#D98C2B" />
            <path d="M -4 -2 L 0 -6 L 4 -2 L 4 4 L -4 4 Z" fill="white" />
          </g>
        </svg>

        {/* Live Moving Marker for Professional Vehicle */}
        <div
          className="absolute transition-all duration-1000 ease-out transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${markerX}px`, top: `${markerY}px` }}
        >
          <div className="relative flex items-center justify-center">
            {isEnRoute && (
              <span className="absolute -inset-3 rounded-full bg-amber-400/40 animate-ping" />
            )}
            <div className="h-10 w-10 rounded-full bg-[#152238] border-2 border-white shadow-xl flex items-center justify-center text-white">
              <Car size={18} className="text-amber-400" />
            </div>
            <span className="absolute -bottom-5 bg-navy-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow whitespace-nowrap">
              {booking.provider?.user?.name?.split(' ')[0] || 'Provider'}
            </span>
          </div>
        </div>

        {/* Floating Live Arrival Widget */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-lg flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
            <Clock size={16} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {isArrived ? 'Status' : isEnRoute ? 'Estimated Arrival' : 'Job Status'}
            </p>
            <p className="text-xs font-bold text-navy-900">
              {isArrived
                ? 'Arrived at your location'
                : isEnRoute
                ? `~${booking.tracking?.estimatedArrivalMins || 12} mins (${booking.tracking?.distanceKm || 3.4} km away)`
                : booking.status === 'in_progress'
                ? 'Work actively in progress'
                : booking.status === 'completed'
                ? 'Job completed & guaranteed'
                : 'Preparing to dispatch'}
            </p>
          </div>
        </div>

        {/* Destination Chip */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
          <MapPin size={13} className="text-amber-600" />
          <span>Customer Address Destination</span>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="p-5 border-b border-slate-100">
        <div className="grid grid-cols-5 gap-2">
          {STATUS_STEPS.map((step, idx) => {
            const isDone = idx < activeIdx;
            const isCurrent = idx === activeIdx;
            return (
              <div key={step.key} className="flex flex-col items-center text-center">
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-[#152238] text-white ring-4 ring-amber-400/40 shadow-xs'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? <CheckCircle size={14} /> : idx + 1}
                </div>
                <p
                  className={`text-[11px] font-bold mt-1.5 leading-tight ${
                    isCurrent ? 'text-navy-900' : isDone ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-slate-400 hidden sm:block mt-0.5">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Provider Quick Actions (When logged in as Provider) */}
      {isProvider && !['completed', 'cancelled'].includes(booking.status) && (
        <div className="p-4 bg-amber-50/50 border-t border-amber-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-navy-900">Provider Trip Status Controls</p>
            <p className="text-[11px] text-slate-600">
              Update your transit progress so the customer can track you live in real-time.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {booking.status === 'scheduled' && (
              <Button
                onClick={() => handleProviderStatusChange('on_the_way')}
                disabled={updating}
                className="text-xs py-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {updating ? <Spinner size={14} className="text-white" /> : <><Navigation size={13} /> Start Travel (On the Way)</>}
              </Button>
            )}
            {booking.status === 'on_the_way' && (
              <Button
                onClick={() => handleProviderStatusChange('arrived')}
                disabled={updating}
                className="text-xs py-2 bg-amber-600 hover:bg-amber-700"
              >
                {updating ? <Spinner size={14} className="text-white" /> : <><MapPin size={13} /> Mark Arrived</>}
              </Button>
            )}
            {booking.status === 'arrived' && (
              <Button
                onClick={() => handleProviderStatusChange('in_progress')}
                disabled={updating}
                className="text-xs py-2 bg-blue-600 hover:bg-blue-700"
              >
                {updating ? <Spinner size={14} className="text-white" /> : <><PlayCircle size={13} /> Start Service</>}
              </Button>
            )}
            {booking.status === 'in_progress' && (
              <Button
                onClick={() => handleProviderStatusChange('completed')}
                disabled={updating}
                className="text-xs py-2 bg-emerald-700 hover:bg-emerald-800"
              >
                {updating ? <Spinner size={14} className="text-white" /> : <><CheckCircle size={13} /> Finish & Complete</>}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
