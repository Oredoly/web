import { useCallback, useEffect, useMemo, useState } from 'react';
import { notificationAPI } from '../api';
import { useAuth } from './AuthContext';
import NotificationContext from './notificationContext';

const POLL_INTERVAL = 60_000;

export default function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!user) return 0;
    const response = await notificationAPI.unreadCount();
    const nextCount = response.data.count;
    setUnreadCount(nextCount);
    return nextCount;
  }, [user]);

  const reduceUnread = useCallback((amount = 1) => {
    setUnreadCount((current) => Math.max(0, current - amount));
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    const initialTimer = window.setTimeout(() => refreshUnread().catch(() => {}), 0);
    const timer = window.setInterval(() => refreshUnread().catch(() => {}), POLL_INTERVAL);
    const handleFocus = () => refreshUnread().catch(() => {});
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshUnread, user]);

  const value = useMemo(() => ({ unreadCount, refreshUnread, reduceUnread }), [
    unreadCount,
    refreshUnread,
    reduceUnread,
  ]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
