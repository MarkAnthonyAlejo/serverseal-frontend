import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Shipment, ShipmentStatus } from '../types';
import { getStatusClasses, getStatusLabel } from '../utils/statusUtils';
import NewShipmentDrawer from '../components/NewShipmentDrawer';
import Toast from '../components/Toast';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

// SortKey is a UI-only type — it only applies to the dashboard's sort dropdown,
// not to any API data shape, so it lives here rather than in types.ts.
type SortKey = 'newest' | 'oldest' | 'updated' | 'status';

// Status order for sort-by-status: active work surfaces first
// Sort order: lower = higher urgency (surfaces most action-needed shipments first)
const STATUS_ORDER: Record<ShipmentStatus, number> = {
  'QA Hold':            0,
  'Under Inspection':   1,
  'In Transit':         2,
  'Pending Inspection': 3,
  'QA Approved':        4,
  'Sealed':             5,
  'Pending':            6,
  'Delivered':          7,
};

const STATUS_FILTERS: { label: string; value: ShipmentStatus | 'ALL' }[] = [
  { label: 'ALL',        value: 'ALL' },
  { label: 'PENDING',    value: 'Pending' },
  { label: 'SEALED',     value: 'Sealed' },
  { label: 'IN_TRANSIT', value: 'In Transit' },
  { label: 'DELIVERED',  value: 'Delivered' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isClient = user?.role === 'Client';

  // useSearchParams keeps filters in the URL so they survive navigation and can be bookmarked.
  // e.g. /?q=BOL-001&status=In+Transit&sort=updated
  const [searchParams, setSearchParams] = useSearchParams();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '' });

  // Read current filter values from URL — default to 'ALL' / 'newest' when absent
  const query        = searchParams.get('q')      || '';
  const statusFilter = (searchParams.get('status') || 'ALL') as ShipmentStatus | 'ALL';
  const sortKey      = (searchParams.get('sort')   || 'newest') as SortKey;

  // Updates a single URL param; removes it entirely when set to the default value
  const setFilter = (key: string, value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      const isDefault = !value || value === 'ALL' || value === 'newest';
      if (isDefault) { next.delete(key); } else { next.set(key, value); }
      return next;
    }, { replace: true }); // replace: true so the back button isn't polluted with filter changes
  };

  const fetchShipments = () => {
    apiFetch('/api/shipments')
      .then(res => {
        if (!res.ok) throw new Error('ERR_FETCH_FAILED');
        return res.json();
      })
      .then(data => setShipments(data))
      .catch(err => setError(err.message));
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleShipmentSuccess = (bol: string) => {
    fetchShipments();
    setToast({ isVisible: true, message: `SHIPMENT_COMMITTED // ${bol}` });
  };

  // filteredShipments is recomputed whenever shipments or any filter param changes.
  // useMemo avoids re-running the filter/sort on every render.
  const filteredShipments = useMemo(() => {
    let result = [...shipments];

    // Live text search across BOL, origin, and destination
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(s =>
        s.bol_number.toLowerCase().includes(q)  ||
        s.origin.toLowerCase().includes(q)       ||
        s.destination.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(s => s.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortKey) {
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'updated':
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        case 'status':
          return (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
        default: // newest
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    return result;
  }, [shipments, query, statusFilter, sortKey]);

  // Counts per status — used to show numbers on the filter pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: shipments.length };
    for (const s of shipments) {
      counts[s.status] = (counts[s.status] || 0) + 1;
    }
    return counts;
  }, [shipments]);

  const filtersActive = !!(query || statusFilter !== 'ALL' || sortKey !== 'newest');

  const clearAllFilters = () => setSearchParams({}, { replace: true });

  return (
    <div className="p-8 flex flex-col gap-8">
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      <header className="flex justify-between items-end border-b border-subtle pb-6">
        <div>
          <h1 className="font-display text-7xl text-accent-primary tracking-tighter leading-none uppercase">
            SERVERSEAL // OPS_DASHBOARD
          </h1>
          <p className="font-mono text-xs text-text-muted mt-2 tracking-[0.2em]">
            TERMINAL_ACTIVE // UNIT_SD_01 // <span className="text-status-ok">ONLINE</span>
          </p>
        </div>
        {!isClient && (
          <button onClick={() => setIsDrawerOpen(true)} className="btn-industrial">
            NEW_SHIPMENT
          </button>
        )}
      </header>

      {error && (
        <div className="border border-status-danger bg-status-danger/10 p-4 font-mono text-status-danger text-sm">
          [!] CRITICAL_DATA_FETCH_FAILURE: {error}
        </div>
      )}

      {/* Filter toolbar — only shown when there is something to filter */}
      {shipments.length > 0 && (
        <div className="flex flex-col gap-3">

          {/* Search input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-text-muted pointer-events-none select-none">
              &gt;_
            </span>
            <input
              type="text"
              value={query}
              onChange={e => setFilter('q', e.target.value)}
              placeholder="SEARCH_BOL // ORIGIN // DESTINATION"
              className="w-full bg-surface border border-subtle text-text-primary font-mono text-sm pl-10 pr-16 py-3 focus:outline-none focus:border-accent-primary/60 placeholder:text-text-muted/30 tracking-wider"
            />
            {query && (
              <button
                onClick={() => setFilter('q', '')}
                className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-text-muted hover:text-text-primary transition-colors tracking-widest"
              >
                [CLR]
              </button>
            )}
          </div>

          {/* Status filter pills + Sort dropdown */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              {STATUS_FILTERS.map(f => {
                const count = statusCounts[f.value] ?? 0;
                const isActive = statusFilter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter('status', f.value)}
                    className={`font-mono text-[10px] tracking-widest px-3 py-1.5 border transition-colors ${
                      isActive
                        ? 'border-accent-primary text-accent-primary bg-accent-primary/5'
                        : 'border-subtle text-text-muted hover:border-text-muted hover:text-text-primary'
                    }`}
                  >
                    {f.label} <span className="opacity-50">({count})</span>
                  </button>
                );
              })}
            </div>

            <select
              value={sortKey}
              onChange={e => setFilter('sort', e.target.value)}
              className="bg-surface border border-subtle text-text-muted font-mono text-[10px] tracking-widest px-3 py-1.5 focus:outline-none focus:border-accent-primary/60 cursor-pointer"
            >
              <option value="newest">SORT: NEWEST</option>
              <option value="oldest">SORT: OLDEST</option>
              <option value="updated">SORT: LAST_UPDATED</option>
              <option value="status">SORT: STATUS</option>
            </select>
          </div>

          {/* Result count + clear all */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] text-text-muted tracking-widest">
              SHOWING <span className="text-text-primary">{filteredShipments.length}</span> OF{' '}
              <span className="text-text-primary">{shipments.length}</span> MANIFESTS
            </span>
            {filtersActive && (
              <button
                onClick={clearAllFilters}
                className="font-mono text-[9px] text-text-muted hover:text-accent-primary transition-colors tracking-widest"
              >
                [CLEAR_ALL_FILTERS]
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty state — no shipments in the database at all */}
      {shipments.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <p className="font-display text-4xl text-text-muted tracking-widest">
            NO_ACTIVE_MANIFESTS // SYSTEM_IDLE
          </p>
          {!isClient && (
            <button onClick={() => setIsDrawerOpen(true)} className="btn-industrial">
              NEW_SHIPMENT
            </button>
          )}
        </div>
      )}

      {/* Empty state — shipments exist but no results match the current filters */}
      {shipments.length > 0 && filteredShipments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="font-display text-4xl text-text-muted tracking-widest">
            NO_RESULTS // ADJUST_FILTERS
          </p>
          <button
            onClick={clearAllFilters}
            className="font-mono text-xs text-text-muted hover:text-accent-primary transition-colors tracking-[0.2em]"
          >
            [CLEAR_ALL_FILTERS]
          </button>
        </div>
      )}

      {/* Shipment grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredShipments.map(s => (
          <button
            key={s.shipment_id}
            onClick={() => navigate(`/shipments/${s.shipment_id}`)}
            className="bg-surface border border-subtle p-6 hover:border-accent-primary/40 transition-colors group relative overflow-hidden text-left w-full"
          >
            {/* Subtle industrial scanline effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-primary/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 pointer-events-none" />

            <div className="flex justify-between items-start mb-6">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
                ID: {s.shipment_id.slice(0, 8)}
              </span>
              <div className="flex items-center gap-2">
                {s.status === 'QA Hold' && (
                  <span className="font-mono text-[9px] bg-status-danger/10 border border-status-danger text-status-danger px-2 py-0.5 animate-pulse">
                    [!] QA_HOLD
                  </span>
                )}
                <span className={`font-mono text-[10px] border px-2 py-0.5 bg-opacity-5 ${getStatusClasses(s.status)}`}>
                  {getStatusLabel(s.status)}
                </span>
              </div>
            </div>

            <h2 className="font-display text-4xl text-text-primary mb-4 tracking-tight">
              {s.bol_number}
            </h2>

            <div className="grid grid-cols-2 gap-4 border-t border-subtle pt-4">
              <div>
                <p className="font-mono text-[9px] text-text-muted uppercase">Origin</p>
                <p className="font-sans text-sm text-text-primary truncate" title={s.origin}>{s.origin}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] text-text-muted uppercase">Destination</p>
                <p className="font-sans text-sm text-text-primary truncate" title={s.destination}>{s.destination}</p>
              </div>
            </div>

            <p className="font-mono text-[9px] text-text-muted mt-4 text-right group-hover:text-accent-primary transition-colors">
              &gt; VIEW_MANIFEST
            </p>
          </button>
        ))}
      </div>

      <NewShipmentDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={(bol) => handleShipmentSuccess(bol)}
      />
    </div>
  );
}
