import { useEffect, useRef, useState, useCallback } from 'react';
import { notifications as notifApi } from '../lib/endpoints';
import { useAuth } from '../context/AuthContext';

// Polls the notifications endpoint every `interval` ms to simulate a live feed
// without needing websockets - simple & reliable for a capstone deployment.
export function useNotifications(interval = 8000) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const timerRef = useRef(null);

  const fetchNow = useCallback(async () => {
    if (!user) return;
    try {
      const { data, unreadCount: uc } = await notifApi.list();
      setItems(data);
      setUnreadCount(uc);
    } catch {
      /* silent - keep last known state */
    }
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    fetchNow();
    timerRef.current = setInterval(fetchNow, interval);
    return () => clearInterval(timerRef.current);
  }, [user, interval, fetchNow]);

  const markRead = async (id) => {
    await notifApi.markRead(id);
    fetchNow();
  };
  const markAllRead = async () => {
    await notifApi.markAllRead();
    fetchNow();
  };

  return { items, unreadCount, markRead, markAllRead, refresh: fetchNow };
}
