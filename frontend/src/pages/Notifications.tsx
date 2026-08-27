import { useEffect, useState } from 'react';
import { api } from '../store/authStore';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function Notifications() {
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { toast.error('Failed'); }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch { toast.error('Failed'); }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch { toast.error('Failed'); }
  };

  const typeIcon = (type: string) => {
    const map: Record<string, string> = {
      PATIENT_REGISTERED: '🧑‍🤝‍🧑',
      PAYMENT_RECEIVED: '💰',
      LOW_STOCK: '📦',
      FOLLOWUP_DUE: '⏰',
      OUTSTANDING_PAYMENT: '⚠️',
      NEW_ORDER: '🛒',
    };
    return map[type] || '🔔';
  };

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 w-full" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="page-header">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">System</p>
          <h1>Notifications</h1>
          <p>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllRead} icon={<CheckCheck size={16} />} variant="secondary">Mark All Read</Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={<Bell size={28} />} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`card p-4 flex items-start gap-4 transition-all ${!n.read ? 'bg-brand-50/30 border-brand-200/50' : ''}`}>
              <div className="w-10 h-10 bg-surface-100 rounded-lg flex items-center justify-center text-lg shrink-0">
                {typeIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${!n.read ? 'text-surface-900' : 'text-surface-700'}`}>{n.title}</p>
                  {!n.read && <span className="w-2 h-2 bg-brand-500 rounded-full" />}
                </div>
                <p className="text-xs text-surface-500 mt-0.5">{n.message}</p>
                <p className="text-2xs text-surface-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!n.read && (
                  <button onClick={() => markRead(n.id)} className="p-1.5 text-surface-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Mark as read">
                    <Check size={15} />
                  </button>
                )}
                <button onClick={() => deleteNotification(n.id)} className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
