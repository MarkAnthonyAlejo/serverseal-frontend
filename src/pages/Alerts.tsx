import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_COLORS,
  timeAgo,
} from '../utils/notificationUtils';
import type { Notification } from '../types';

// --- Notification card ---

function NotificationCard({ n, onMarkRead }: { n: Notification; onMarkRead: (id: string) => void }) {
  const colorClass = NOTIFICATION_TYPE_COLORS[n.type] ?? 'text-text-muted border-subtle bg-white/5';
  const label      = NOTIFICATION_TYPE_LABELS[n.type] ?? n.type.toUpperCase();

  return (
    <div
      className={`border rounded-sm p-4 flex gap-4 items-start transition-all ${
        n.is_read ? 'opacity-50' : 'border-accent-primary/20 bg-surface'
      }`}
    >
      {/* Unread indicator dot */}
      <div className="pt-1 shrink-0">
        {n.is_read
          ? <div className="w-2 h-2 rounded-full border border-subtle" />
          : <div className="w-2 h-2 rounded-full bg-accent-primary" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`font-mono text-[9px] tracking-widest px-1.5 py-0.5 border rounded-sm ${colorClass}`}>
            {label}
          </span>
          {n.bol_number && n.shipment_id && (
            <Link
              to={`/shipments/${n.shipment_id}`}
              className="font-mono text-[10px] text-accent-primary hover:underline tracking-wider"
            >
              BOL#{n.bol_number}
            </Link>
          )}
          <span className="font-mono text-[10px] text-text-muted ml-auto">
            {timeAgo(n.created_at)}
          </span>
        </div>
        <p className="font-mono text-xs text-text-secondary leading-relaxed">{n.message}</p>
      </div>

      {!n.is_read && (
        <button
          onClick={() => onMarkRead(n.notification_id)}
          className="shrink-0 font-mono text-[9px] text-text-muted hover:text-text-primary tracking-widest transition-colors"
          title="Mark as read"
        >
          ACK
        </button>
      )}
    </div>
  );
}

// --- Page ---

export default function Alerts() {
  const { notifications, unreadCount, markRead, markAllRead, refresh } = useNotifications();

  useEffect(() => { refresh(); }, []);

  const unread = notifications.filter((n) => !n.is_read);
  const read   = notifications.filter((n) =>  n.is_read);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl tracking-tighter text-text-primary">
            ALERT_FEED
          </h1>
          <p className="font-mono text-[10px] text-text-muted mt-1 tracking-widest uppercase">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="btn-industrial font-mono text-xs tracking-widest"
          >
            MARK_ALL_READ
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="border border-subtle rounded-sm p-12 text-center">
          <p className="font-mono text-xs text-text-muted tracking-widest">NO_ALERTS_FOUND</p>
          <p className="font-mono text-[10px] text-text-muted mt-2">
            Notifications will appear here when shipment events occur.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {unread.length > 0 && (
            <section>
              <div className="font-mono text-[10px] text-text-muted tracking-widest uppercase mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary inline-block" />
                UNREAD ({unread.length})
              </div>
              <div className="flex flex-col gap-2">
                {unread.map((n) => (
                  <NotificationCard key={n.notification_id} n={n} onMarkRead={markRead} />
                ))}
              </div>
            </section>
          )}

          {read.length > 0 && (
            <section>
              <div className="font-mono text-[10px] text-text-muted tracking-widest uppercase mb-3">
                READ ({read.length})
              </div>
              <div className="flex flex-col gap-2">
                {read.map((n) => (
                  <NotificationCard key={n.notification_id} n={n} onMarkRead={markRead} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
