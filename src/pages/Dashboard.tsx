import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import type { Shipment } from '../types';
import { getStatusClasses, getStatusLabel } from '../utils/statusUtils';
import NewShipmentDrawer from '../components/NewShipmentDrawer';
import Toast from '../components/Toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toast, setToast] = useState({ isVisible: false, message: '' });

  const fetchShipments = () => {
    fetch('/api/shipments')
      .then(res => {
        if (!res.ok) throw new Error('ERR_FETCH_FAILED');
        return res.json();
      })
      .then(data => setShipments(data))
      .catch(err => setError(err.message));
  };

  const handleShipmentSuccess = (bol: string) => {
    fetchShipments();
    setToast({
      isVisible: true,
      message: `SHIPMENT_COMMITTED // ${bol}`
    });
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  return (
    <div className="p-8 flex flex-col gap-10">
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

        <button
          onClick={() => setIsDrawerOpen(true)}
          className="btn-industrial"
        >
          NEW_SHIPMENT
        </button>
      </header>

      {error && (
        <div className="border border-status-danger bg-status-danger/10 p-4 font-mono text-status-danger text-sm">
          [!] CRITICAL_DATA_FETCH_FAILURE: {error}
        </div>
      )}

      {shipments.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <p className="font-display text-4xl text-text-muted tracking-widest">
            NO_ACTIVE_MANIFESTS // SYSTEM_IDLE
          </p>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="btn-industrial"
          >
            NEW_SHIPMENT
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shipments.map(s => (
          <button
            key={s.shipment_id}
            onClick={() => navigate(`/shipments/${s.shipment_id}`)}
            className="bg-surface border border-subtle p-6 hover:border-accent-primary/40 transition-colors group relative overflow-hidden text-left w-full"
          >
            {/* Subtle Industrial Scanline Effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-primary/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 pointer-events-none" />

            <div className="flex justify-between items-start mb-6">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
                ID: {s.shipment_id.slice(0, 8)}
              </span>
              <span className={`font-mono text-[10px] border px-2 py-0.5 bg-opacity-5 ${getStatusClasses(s.status)}`}>
                {getStatusLabel(s.status)}
              </span>
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
