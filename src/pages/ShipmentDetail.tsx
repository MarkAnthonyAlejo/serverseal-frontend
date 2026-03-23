import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ShipmentDetail as ShipmentDetailType } from '../types';
import { getStatusClasses, getStatusLabel } from '../utils/statusUtils';
import EventCard from '../components/EventCard';
import LogEventDrawer from '../components/LogEventDrawer';
import StatusControl from '../components/StatusControl';
import Toast from '../components/Toast';

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

  const [data, setData] = useState<ShipmentDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '' });

  const fetchData = () => {
    fetch(`/api/shipments/${id}`)
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
      setData({ ...data, shipment: { ...data.shipment, status: newStatus } });
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

  const { shipment, history } = data;

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
          <span className={`font-mono text-xs border px-3 py-1 mt-2 ${getStatusClasses(shipment.status)}`}>
            {getStatusLabel(shipment.status)}
          </span>
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
      </header>

      {/* Status control */}
      <StatusControl
        shipmentId={shipment.shipment_id}
        currentStatus={shipment.status}
        onStatusChange={handleStatusChange}
      />

      {/* Event timeline */}
      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-display text-4xl text-text-primary tracking-tight">
            CHAIN_OF_CUSTODY // EVENT_LOG
          </h2>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="btn-industrial text-base px-6 py-2"
          >
            LOG_NEW_EVENT
          </button>
        </div>

        {history.length === 0 ? (
          <div className="border border-subtle p-12 text-center">
            <p className="font-display text-3xl text-text-muted tracking-widest">
              NO_EVENTS_LOGGED // CHAIN_OF_CUSTODY_EMPTY
            </p>
            <p className="font-mono text-xs text-text-muted mt-3">
              Log the first custody event to begin the audit trail.
            </p>
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
