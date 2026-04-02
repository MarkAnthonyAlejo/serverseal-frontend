import type { NotificationType } from '../types';

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  qa_assigned:        'QA_ASSIGNED',
  inspection_started: 'INSPECTION_STARTED',
  qa_verdict:         'QA_VERDICT',
  hold_resolved:      'HOLD_RESOLVED',
  status_changed:     'STATUS_CHANGED',
};

export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  qa_assigned:        'text-accent-primary border-accent-primary/40 bg-accent-primary/5',
  inspection_started: 'text-status-warning border-status-warning/40 bg-status-warning/5',
  qa_verdict:         'text-status-ok border-status-ok/40 bg-status-ok/5',
  hold_resolved:      'text-status-error border-status-error/40 bg-status-error/5',
  status_changed:     'text-text-muted border-subtle bg-white/5',
};

export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
