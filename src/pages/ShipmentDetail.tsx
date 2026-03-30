import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import type { ShipmentDetail as ShipmentDetailType, ShipmentStatus, StatusHistoryEntry } from '../types';
import { getStatusClasses, getStatusLabel } from '../utils/statusUtils';
import EventCard from '../components/EventCard';
import LogEventDrawer from '../components/LogEventDrawer';
import StatusControl from '../components/StatusControl';
import QAInspectionPanel from '../components/QAInspectionPanel';
import Toast from '../components/Toast';

// The 4 main milestones shown in the status timeline.
// QA statuses all map to the Pending step — details are shown in QAInspectionPanel.
const TIMELINE_STEPS: ShipmentStatus[] = ['Pending', 'Sealed', 'In Transit', 'Delivered'];

const QA_STATUSES: ShipmentStatus[] = ['Pending Inspection', 'Under Inspection', 'QA Hold', 'QA Approved'];

function getTimelineIndex(status: ShipmentStatus): number {
  if (QA_STATUSES.includes(status)) return 0;
  return TIMELINE_STEPS.indexOf(status);
}

function formatTimestamp(ts?: string): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
    timeZoneName: 'short',
  });
}

export default function ShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isClient      = user?.role === 'Client';
  const isQAInspector = user?.role === 'QA Inspector';

  const [data, setData] = useState<ShipmentDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '' });

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      const res = await apiFetch(`/api/shipments/${id}/report`);
      if (!res.ok) throw new Error('REPORT_GENERATION_FAILED');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `serverseal_report_${id?.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ isVisible: true, message: '[!] REPORT_GENERATION_FAILED' });
    } finally {
      setIsDownloading(false);
    }
  };

  const fetchData = () => {
    apiFetch(`/api/shipments/${id}`)
      .then(res => {
        if (res.status === 404) { setNotFound(true); return null; }
        if (!res.ok) throw new Error('ERR_FETCH_FAILED');
        return res.json();
      })
      .then(json => {
        if (json) setData(json);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEventSuccess = () => {
    fetchData();
    setToast({ isVisible: true, message: 'EVENT_COMMITTED // CHAIN_UPDATED' });
  };

  const handleStatusChange = (newStatus: ShipmentDetailType['shipment']['status']) => {
    if (data) {
      const newEntry: StatusHistoryEntry = {
        history_id: crypto.randomUUID(),
        shipment_id: data.shipment.shipment_id,
        status: newStatus,
        changed_at: new Date().toISOString(),
      };
      setData({
        ...data,
        shipment: { ...data.shipment, status: newStatus },
        status_history: [...data.status_history, newEntry],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="font-display text-5xl text-text-muted tracking-widest animate-pulse">
          LOADING_MANIFEST...
        </p>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <p className="font-mono text-xs text-status-danger tracking-widest">[!] MANIFEST_NOT_FOUND</p>
        <h2 className="font-display text-6xl text-text-primary tracking-tighter">ERR_SHIPMENT_404</h2>
        <button
          onClick={() => navigate('/')}
          className="font-mono text-xs text-accent-primary border border-accent-primary px-6 py-3 hover:bg-accent-primary hover:text-base transition-colors tracking-widest uppercase"
        >
          &gt; RETURN_TO_DASHBOARD
        </button>
      </div>
    );
  }

  const { shipment, history, status_history } = data;

  return (
    <div className="p-8 flex flex-col gap-10">
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      {/* Back nav */}
      <button
        onClick={() => navigate('/')}
        className="font-mono text-[10px] text-text-muted hover:text-accent-primary transition-colors self-start tracking-widest uppercase"
      >
        &lt; BACK_TO_DASHBOARD
      </button>

      {/* Shipment header */}
      <header className="border-b border-subtle pb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="font-mono text-[10px] text-text-muted tracking-widest uppercase mb-2">
              MANIFEST // {shipment.shipment_id.slice(0, 8)}
            </p>
            <h1 className="font-display text-7xl text-text-primary tracking-tighter leading-none uppercase">
              {shipment.bol_number}
            </h1>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className={`font-mono text-xs border px-3 py-1 ${getStatusClasses(shipment.status)}`}>
              {getStatusLabel(shipment.status)}
            </span>
            <button
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className="font-mono text-[10px] tracking-widest border border-subtle text-text-muted px-4 py-2 hover:border-accent-primary hover:text-accent-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed uppercase"
            >
              {isDownloading ? <span className="animate-pulse">GENERATING...</span> : 'DOWNLOAD_REPORT'}
            </button>
          </div>
        </div>

        <p className="font-mono text-lg text-text-primary mt-4">
          <span className="text-text-muted text-sm">FROM</span>{' '}
          {shipment.origin}{' '}
          <span className="text-accent-primary mx-2">&gt;</span>{' '}
          <span className="text-text-muted text-sm">TO</span>{' '}
          {shipment.destination}
        </p>

        <p className="font-mono text-[10px] text-text-muted mt-3 tracking-widest">
          INITIATED: {formatTimestamp(shipment.created_at)}
        </p>

        {/* Status timeline */}
        <div className="mt-8">
          <p className="font-mono text-[9px] text-text-muted tracking-widest uppercase mb-4">STATUS_TIMELINE</p>
          <div className="grid grid-cols-4 relative">
            {/* Base line */}
            <div className="absolute top-[5px] left-[12.5%] right-[12.5%] h-px bg-subtle" />
            {/* Progress line */}
            <div
              className="absolute top-[5px] left-[12.5%] h-px bg-accent-primary transition-all duration-500"
              style={{ width: `${getTimelineIndex(shipment.status) * 25}%` }}
            />
            {TIMELINE_STEPS.map((s: ShipmentStatus, i: number) => {
              const entry = status_history.find(e => e.status === s);
              const statusIndex = getTimelineIndex(shipment.status);
              const isReached = i <= statusIndex;
              const isCurrent = i === statusIndex;
              return (
                <div key={s} className="flex flex-col items-center relative z-10">
                  <div className={`w-2.5 h-2.5 border-2 ${
                    isCurrent ? 'bg-accent-primary border-accent-primary' :
                    isReached ? 'bg-accent-primary/20 border-accent-primary' :
                    'bg-base border-subtle'
                  }`} />
                  <span className={`font-mono text-[8px] mt-2 uppercase tracking-wider text-center leading-tight ${
                    isCurrent ? 'text-accent-primary' :
                    isReached ? 'text-text-muted' :
                    'text-text-muted/25'
                  }`}>
                    {getStatusLabel(s)}
                  </span>
                  <span className="font-mono text-[8px] text-text-muted/60 mt-0.5 text-center">
                    {entry ? new Date(entry.changed_at).toLocaleString('en-US', {
                      month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    }) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* QA Inspection Panel — shown to all roles when relevant */}
      <QAInspectionPanel
        shipmentId={shipment.shipment_id}
        shipmentStatus={shipment.status}
        onStatusChange={handleStatusChange}
      />

      {/* Status control — hidden from Client and QA Inspector */}
      {!isClient && !isQAInspector && (
        <StatusControl
          shipmentId={shipment.shipment_id}
          currentStatus={shipment.status}
          userRole={user?.role ?? ''}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Event timeline */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-display text-4xl text-text-primary tracking-tight">
            CHAIN_OF_CUSTODY // EVENT_LOG
          </h2>
          {!isClient && (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="btn-industrial text-base px-6 py-2"
            >
              LOG_NEW_EVENT
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="border border-subtle p-12 flex flex-col items-center gap-4 text-center">
            <p className="font-mono text-[9px] text-text-muted tracking-widest uppercase">
              CHAIN_OF_CUSTODY_EMPTY
            </p>
            <p className="font-display text-3xl text-text-muted tracking-widest">
              NO_EVENTS_LOGGED
            </p>
            <p className="font-mono text-xs text-text-muted">
              Log the first event to begin the chain-of-custody audit trail.
            </p>
            {!isClient && (
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="btn-industrial px-6 py-2 mt-2"
              >
                LOG_FIRST_EVENT
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            {history.map((event, i) => (
              <EventCard key={event.event_id} event={event} index={i} />
            ))}
          </div>
        )}
      </section>

      <LogEventDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={handleEventSuccess}
        shipmentId={shipment.shipment_id}
      />
    </div>
  );
}
