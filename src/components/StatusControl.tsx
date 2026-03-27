import { useState } from 'react';
import type { ShipmentStatus } from '../types';
import { getStatusClasses, getStatusLabel } from '../utils/statusUtils';
import { apiFetch } from '../api';

interface StatusControlProps {
  shipmentId: string;
  currentStatus: ShipmentStatus;
  userRole: string;
  onStatusChange: (newStatus: ShipmentStatus) => void;
}

// Admin can resolve QA Hold and advance through QA Approved → Sealed → In Transit → Delivered
const ADMIN_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  'Pending':            [],
  'Pending Inspection': [],
  'Under Inspection':   [],
  'QA Hold':            ['QA Approved', 'Under Inspection'],
  'QA Approved':        ['Sealed'],
  'Sealed':             ['In Transit'],
  'In Transit':         ['Delivered', 'Pending'],
  'Delivered':          [],
};

// Driver can only advance once QA is cleared
const DRIVER_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  'Pending':            [],
  'Pending Inspection': [],
  'Under Inspection':   [],
  'QA Hold':            [],
  'QA Approved':        ['Sealed'],
  'Sealed':             ['In Transit'],
  'In Transit':         ['Delivered', 'Pending'],
  'Delivered':          [],
};

const NEXT_STATUS_STYLE: Record<ShipmentStatus, string> = {
  'Pending':            'border-text-muted text-text-muted hover:bg-text-muted hover:text-base',
  'Pending Inspection': 'border-status-warn text-status-warn hover:bg-status-warn hover:text-base',
  'Under Inspection':   'border-status-warn text-status-warn hover:bg-status-warn hover:text-base',
  'QA Hold':            'border-status-danger text-status-danger hover:bg-status-danger hover:text-base',
  'QA Approved':        'border-status-ok text-status-ok hover:bg-status-ok hover:text-base',
  'Sealed':             'border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-base',
  'In Transit':         'border-status-warn text-status-warn hover:bg-status-warn hover:text-base',
  'Delivered':          'border-status-ok text-status-ok hover:bg-status-ok hover:text-base',
};

// Contextual messages for statuses with no manual transitions
const STATUS_MESSAGES: Partial<Record<ShipmentStatus, string>> = {
  'Pending':            'ASSIGN_QA_INSPECTOR // USE_QA_PANEL_BELOW',
  'Pending Inspection': 'AWAITING_QA_START // INSPECTOR_NOTIFIED',
  'Under Inspection':   'INSPECTION_IN_PROGRESS // AWAITING_QA_SUBMISSION',
  'Delivered':          'SHIPMENT_CLOSED // NO_FURTHER_TRANSITIONS',
};

export default function StatusControl({ shipmentId, currentStatus, userRole, onStatusChange }: StatusControlProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [pending, setPending] = useState<ShipmentStatus | null>(null);

  const transitions = userRole === 'Admin' ? ADMIN_TRANSITIONS : DRIVER_TRANSITIONS;
  const nextStates = transitions[currentStatus] ?? [];

  const handleTransition = async () => {
    if (!pending) return;
    setIsUpdating(true);
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: pending }),
      });
      if (res.ok) {
        onStatusChange(pending);
      }
    } finally {
      setIsUpdating(false);
      setPending(null);
    }
  };

  return (
    <>
      {/* Confirmation modal */}
      {pending && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-surface border border-accent-primary p-8 w-96 shadow-2xl">
            <p className="font-mono text-[10px] text-text-muted tracking-widest uppercase mb-3">
              [!] CONFIRM_STATUS_TRANSITION
            </p>
            <h3 className="font-display text-4xl text-text-primary tracking-tight mb-2">
              ARE YOU SURE?
            </h3>
            <p className="font-mono text-sm text-text-muted mb-6">
              This will transition the shipment from{' '}
              <span className={getStatusClasses(currentStatus)}>{getStatusLabel(currentStatus)}</span>
              {' '}→{' '}
              <span className={getStatusClasses(pending)}>{getStatusLabel(pending)}</span>.
              {' '}This action will be recorded in the audit trail.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleTransition}
                disabled={isUpdating}
                className="btn-industrial flex-1 py-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isUpdating ? <span className="animate-pulse">UPDATING...</span> : 'CONFIRM'}
              </button>
              <button
                onClick={() => setPending(null)}
                disabled={isUpdating}
                className="flex-1 py-3 font-mono text-sm border border-subtle text-text-muted hover:border-text-muted transition-colors disabled:opacity-40"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status control bar */}
      <div className="border border-subtle p-5 flex flex-wrap items-center gap-4">
        <div>
          <p className="font-mono text-[9px] text-text-muted tracking-widest uppercase mb-1">CURRENT_STATUS</p>
          <span className={`font-mono text-sm border px-3 py-1 ${getStatusClasses(currentStatus)}`}>
            {getStatusLabel(currentStatus)}
          </span>
        </div>

        {nextStates.length > 0 ? (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[9px] text-text-muted tracking-widest uppercase">TRANSITION_TO &gt;</span>
            {nextStates.map(s => (
              <button
                key={s}
                onClick={() => setPending(s)}
                disabled={isUpdating}
                className={`font-mono text-xs border px-4 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${NEXT_STATUS_STYLE[s]}`}
              >
                {getStatusLabel(s)}
              </button>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[10px] text-text-muted tracking-widest uppercase">
            {STATUS_MESSAGES[currentStatus] ?? 'SHIPMENT_CLOSED // NO_FURTHER_TRANSITIONS'}
          </p>
        )}
      </div>
    </>
  );
}
