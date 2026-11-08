import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function NotificationBell({ notify }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ notifications: [], unreadCount: 0 });

  const load = () => api('/notifications').then(setData).catch(() => {});
  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const markRead = async () => {
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
      setData((current) => ({ ...current, unreadCount: 0, notifications: current.notifications.map((item) => ({ ...item, isRead: true })) }));
    } catch (error) {
      notify(error.message, 'error');
    }
  };

  return <div className="notification-wrap">
    <button className="notification-button" onClick={() => setOpen((value) => !value)} aria-label="Notifications" aria-expanded={open}>
      ♢
      {data.unreadCount > 0 && <span className="notification-count">{data.unreadCount > 9 ? '9+' : data.unreadCount}</span>}
    </button>
    {open && <div className="notification-panel">
      <div className="notification-heading"><strong>Notifications</strong><button onClick={markRead} disabled={!data.unreadCount}>Mark all read</button></div>
      {data.notifications.length ? data.notifications.map((item) => <div className={`notification-item ${item.isRead ? '' : 'unread'}`} key={item.id}><strong>{item.title}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small></div>) : <div className="notification-empty">No notifications yet.</div>}
    </div>}
  </div>;
}
