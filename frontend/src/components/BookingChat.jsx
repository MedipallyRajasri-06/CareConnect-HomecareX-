import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, Clock, Check, CheckCheck, Sparkles, Phone, Mail, User } from 'lucide-react';
import { bookings as bookingsApi } from '../lib/endpoints';
import { useAuth } from '../context/AuthContext';
import { Avatar, Button, Spinner } from './ui';
import { format, formatDistanceToNow } from 'date-fns';

export default function BookingChat({
  bookingId,
  otherUser,
  otherRole = 'Provider',
  className = '',
}) {
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const isFirstLoad = useRef(true);

  const fetchMessages = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await bookingsApi.getMessages(bookingId);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  // Initial fetch and polling every 2.5 seconds
  useEffect(() => {
    isFirstLoad.current = true;
    fetchMessages();
    const interval = setInterval(fetchMessages, 2500);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isFirstLoad.current ? 'auto' : 'smooth',
      });
      isFirstLoad.current = false;
    }
  }, [messages]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim() || sending) return;

    const messageText = text.trim();
    setText('');
    setSending(true);

    try {
      const res = await bookingsApi.sendMessage(bookingId, { text: messageText });
      if (res.data) {
        setMessages((prev) => [...prev, res.data]);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // restore text on failure
      setText(messageText);
    } finally {
      setSending(false);
    }
  };

  const isCustomer = currentUser?.role === 'customer';

  const quickReplies = isCustomer
    ? [
        'When will you arrive?',
        'I am at home and waiting for you.',
        'Please call when you reach the gate.',
        'Thank you so much!',
      ]
    : [
        'I am on my way now!',
        'I have arrived at your location.',
        'Job is in progress, going smoothly.',
        'Job completed! Please inspect.',
      ];

  const handleQuickReply = (reply) => {
    setText(reply);
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden ${className}`}>
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-[#FBFBFC] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar
              name={otherUser?.name || otherRole}
              color={otherUser?.avatarColor}
              size={40}
            />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-navy-900 leading-none">
                {otherUser?.name || `${otherRole}`}
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FBEAD2] text-[#925611]">
                {otherRole}
              </span>
            </div>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Direct Chat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {otherUser?.phone && (
            <a
              href={`tel:${otherUser.phone}`}
              className="p-2 rounded-xl text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition-colors"
              title={`Call ${otherUser.phone}`}
            >
              <Phone size={16} />
            </a>
          )}
          {otherUser?.email && (
            <a
              href={`mailto:${otherUser.email}`}
              className="p-2 rounded-xl text-slate-500 hover:text-navy-900 hover:bg-slate-100 transition-colors"
              title={`Email ${otherUser.email}`}
            >
              <Mail size={16} />
            </a>
          )}
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3 min-h-[300px] max-h-[420px] bg-slate-50/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
            <Spinner size={24} />
            <span className="text-xs">Connecting to secure chat...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-amber-100/70 text-[#D98C2B] flex items-center justify-center mx-auto shadow-xs">
              <MessageSquare size={22} />
            </div>
            <h4 className="text-sm font-bold text-navy-900">Direct Chat Active</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Send a message to coordinate arrival, share directions, or ask any questions about this booking.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = String(m.sender?._id || m.sender) === String(currentUser?._id);
            return (
              <div
                key={m._id}
                className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <Avatar
                    name={m.sender?.name || otherRole}
                    color={m.sender?.avatarColor}
                    size={28}
                    className="shrink-0 mb-1"
                  />
                )}
                <div
                  className={`max-w-[78%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs text-sm leading-relaxed ${
                    isMe
                      ? 'bg-[#152238] text-white rounded-br-xs'
                      : 'bg-white text-navy-900 border border-slate-200/90 rounded-bl-xs'
                  }`}
                >
                  {!isMe && (
                    <p className="text-[11px] font-bold text-[#D98C2B] mb-0.5">
                      {m.sender?.name || otherRole}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMe ? 'text-slate-300' : 'text-slate-400'
                    }`}
                  >
                    <span>
                      {m.createdAt ? format(new Date(m.createdAt), 'h:mm a') : ''}
                    </span>
                    {isMe && (
                      m.read ? (
                        <CheckCheck size={13} className="text-emerald-400" title="Read" />
                      ) : (
                        <Check size={13} className="text-slate-400" title="Delivered" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies Carousel / Pills */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1 mr-1">
          <Sparkles size={12} className="text-amber-500" /> Suggestions:
        </span>
        {quickReplies.map((reply, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickReply(reply)}
            className="text-xs bg-white hover:bg-amber-50 text-slate-700 hover:text-[#925611] px-2.5 py-1 rounded-full border border-slate-200 hover:border-amber-300 transition-colors whitespace-nowrap shrink-0 shadow-2xs font-medium cursor-pointer"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${otherUser?.name || otherRole}...`}
          className="flex-1 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-[#D98C2B] focus:ring-2 focus:ring-amber-500/20 rounded-xl px-4 py-2.5 text-sm text-navy-900 placeholder:text-slate-400 transition-all outline-none"
        />
        <Button
          type="submit"
          disabled={!text.trim() || sending}
          className="rounded-xl px-4 py-2.5 bg-[#D98C2B] hover:bg-[#b8731f] text-white shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
        >
          {sending ? (
            <Spinner size={16} className="text-white" />
          ) : (
            <>
              <span className="hidden sm:inline">Send</span>
              <Send size={15} />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
