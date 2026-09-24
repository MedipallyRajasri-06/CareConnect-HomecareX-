import { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Sparkles, Clock, MessageSquare } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-xl border transition-all duration-150 ${
          open
            ? 'bg-slate-100 border-slate-300 text-navy-900'
            : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 hover:text-navy-900'
        }`}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2.5 w-84 sm:w-92 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 max-h-[28rem] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-navy-900">Activity & Updates</span>
              {unreadCount > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <CheckCheck size={14} /> Mark read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {items.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
                  <Sparkles size={18} />
                </div>
                <p className="text-sm font-semibold text-slate-700">All caught up!</p>
                <p className="text-xs text-muted mt-1">You will receive updates when quotes arrive or status changes.</p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  onClick={() => {
                    markRead(n._id);
                    setOpen(false);
                    if (n.link) navigate(n.link);
                  }}
                  className={`w-full text-left px-4 py-3.5 hover:bg-slate-50/90 transition-colors flex items-start gap-3 ${
                    !n.isRead ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="mt-1 shrink-0">
                    {!n.isRead ? (
                      <span className="block h-2 w-2 rounded-full bg-blue-600" />
                    ) : (
                      <span className="block h-2 w-2 rounded-full bg-slate-200" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`text-xs sm:text-sm text-slate-900 ${!n.isRead ? 'font-bold' : 'font-medium'}`}>
                        {n.title}
                      </p>
                      {n.type === 'chat_message' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#D98C2B] bg-amber-50 px-1.5 py-0.2 rounded-md border border-amber-200/60">
                          <MessageSquare size={10} /> Chat
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[11px] text-muted-light mt-1.5 flex items-center gap-1">
                      <Clock size={11} />
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
