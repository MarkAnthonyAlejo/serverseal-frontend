import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Shipment } from '../types';
import { apiFetch } from '../api';

// Formats a timestamp like "2025-03-24T14:30:00" into "MAR 24, 2025 14:30"
function formatTimestamp(ts: string | undefined): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).toUpperCase();
}

export default function ActiveLogs() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/shipments/active')
      .then(res => {
        if (!res.ok) throw new Error('ERR_FETCH_FAILED');
        return res.json();
      })
      .then(data => {
        setShipments(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 flex flex-col gap-10">

      <header className="flex justify-between items-end border-b border-subtle pb-6">
        <div>
          <h1 className="font-display text-7xl text-accent-primary tracking-tighter leading-none uppercase">
            ACTIVE_LOGS // IN_TRANSIT
          </h1>
          <p className="font-mono text-xs text-text-muted mt-2 tracking-[0.2em]">
            LIVE_MONITOR // TRACKING_ACTIVE_MANIFESTS // <span className="text-status-warn">IN_TRANSIT</span>
          </p>
        </div>
        <div className="font-mono text-[10px] text-text-muted border border-subtle px-3 py-2">
          <span className="text-status-warn">{shipments.length}</span> ACTIVE
        </div>
      </header>

      {error && (
        <div className="border border-status-danger bg-status-danger/10 p-4 font-mono text-status-danger text-sm">
          [!] CRITICAL_DATA_FETCH_FAILURE: {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-24">
          <p className="font-mono text-xs text-text-muted tracking-[0.3em] animate-pulse">
            QUERYING_ACTIVE_MANIFESTS...
          </p>
        </div>
      )}

      {!loading && !error && shipments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="font-display text-4xl text-text-muted tracking-widest">
            NO_ACTIVE_MANIFESTS
          </p>
          <p className="font-mono text-xs text-text-muted tracking-[0.2em]">
            ALL SHIPMENTS ARE PENDING, SEALED, OR DELIVERED
          </p>
        </div>
      )}

      {!loading && shipments.length > 0 && (
        <div className="flex flex-col gap-0 border border-subtle">

          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1.2fr_1.2fr_1fr_1fr] gap-4 px-6 py-3 bg-surface border-b border-subtle">
            <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">BOL_NUMBER</span>
            <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">ORIGIN</span>
            <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">DESTINATION</span>
            <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">LAST_EVENT</span>
            <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">LAST_UPDATED</span>
          </div>

          {/* Rows */}
          {shipments.map((s, i) => (
            <button
              key={s.shipment_id}
              onClick={() => navigate(`/shipments/${s.shipment_id}`)}
              className={`
                grid grid-cols-[1fr_1.2fr_1.2fr_1fr_1fr] gap-4 px-6 py-5
                text-left w-full transition-all group
                hover:bg-status-warn/5 hover:border-l-4 hover:border-l-status-warn
                ${i !== shipments.length - 1 ? 'border-b border-subtle' : ''}
              `}
            >
              {/* BOL Number */}
              <div className="flex flex-col gap-1">
                <span className="font-display text-xl text-text-primary tracking-tight group-hover:text-status-warn transition-colors">
                  {s.bol_number}
                </span>
                <span className="font-mono text-[9px] text-text-muted">
                  ID: {s.shipment_id.slice(0, 8)}
                </span>
              </div>

              {/* Origin */}
              <div className="flex items-center">
                <span className="font-sans text-sm text-text-primary truncate" title={s.origin}>
                  {s.origin}
                </span>
              </div>

              {/* Destination */}
              <div className="flex items-center">
                <span className="font-sans text-sm text-text-primary truncate" title={s.destination}>
                  {s.destination}
                </span>
              </div>

              {/* Last Event Type */}
              <div className="flex items-center">
                {s.last_event_type ? (
                  <span className="font-mono text-[10px] border border-status-warn/40 text-status-warn px-2 py-0.5">
                    {s.last_event_type.toUpperCase().replace(' ', '_')}
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-text-muted">NO_EVENTS</span>
                )}
              </div>

              {/* Last Updated */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-text-muted">
                  {formatTimestamp(s.last_event_at)}
                </span>
                <span className="font-mono text-[9px] text-text-muted group-hover:text-status-warn transition-colors opacity-0 group-hover:opacity-100">
                  &gt; VIEW
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
