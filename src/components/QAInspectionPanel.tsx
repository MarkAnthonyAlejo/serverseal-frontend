import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import type { QAInspection, QADisposition, QAUser, ShipmentStatus } from '../types';

interface QAInspectionPanelProps {
  shipmentId: string;
  shipmentStatus: ShipmentStatus;
  onStatusChange: (newStatus: ShipmentStatus) => void;
}

const DISPOSITION_STYLE: Record<QADisposition, string> = {
  'Pass':        'border-status-ok text-status-ok',
  'Conditional': 'border-accent-primary text-accent-primary',
  'Fail':        'border-status-danger text-status-danger',
  'QA Hold':     'border-status-danger text-status-danger',
};

const INSPECTION_STATUS_STYLE: Record<string, string> = {
  'Pending':     'text-text-muted',
  'In Progress': 'text-status-warn',
  'Passed':      'text-status-ok',
  'Failed':      'text-status-danger',
  'On Hold':     'text-status-danger',
};

export default function QAInspectionPanel({ shipmentId, shipmentStatus, onStatusChange }: QAInspectionPanelProps) {
  const { user } = useAuth();
  const isAdmin       = user?.role === 'Admin';
  const isQAInspector = user?.role === 'QA Inspector';

  const [inspection, setInspection]     = useState<QAInspection | null>(null);
  const [qaUsers, setQaUsers]           = useState<QAUser[]>([]);
  const [selectedQaId, setSelectedQaId] = useState('');
  const [isAssigning, setIsAssigning]   = useState(false);
  const [isStarting, setIsStarting]     = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolving, setIsResolving]   = useState(false);

  // Add-item form state
  const [newManufacturer, setNewManufacturer] = useState('');
  const [newModel, setNewModel]               = useState('');
  const [newSerial, setNewSerial]             = useState('');
  const [newQty, setNewQty]                   = useState(1);
  const [newVisual, setNewVisual]             = useState<'Pass' | 'Fail' | ''>('');
  const [newPackaging, setNewPackaging]       = useState<'Pass' | 'Fail' | ''>('');
  const [newDamageNotes, setNewDamageNotes]   = useState('');
  const [newDisposition, setNewDisposition]   = useState('');
  const [isAddingItem, setIsAddingItem]       = useState(false);

  // Submit form state
  const [overallDisposition, setOverallDisposition] = useState<QADisposition | ''>('');
  const [submissionNotes, setSubmissionNotes]       = useState('');

  const fetchInspection = () => {
    apiFetch(`/api/shipments/${shipmentId}/inspection`)
      .then(res => res.ok ? res.json() : null)
      .then(data => setInspection(data));
  };

  useEffect(() => {
    fetchInspection();
    if (isAdmin) {
      apiFetch('/api/users/qa')
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setQaUsers(data);
          if (data.length > 0) setSelectedQaId(data[0].user_id);
        });
    }
  }, [shipmentId]);

  const handleAssign = async () => {
    if (!selectedQaId) return;
    setIsAssigning(true);
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}/inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qa_user_id: selectedQaId }),
      });
      if (res.ok) {
        onStatusChange('Pending Inspection');
        fetchInspection();
      }
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}/inspection/start`, { method: 'PATCH' });
      if (res.ok) {
        onStatusChange('Under Inspection');
        fetchInspection();
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleAddItem = async () => {
    if (!newSerial.trim()) return;
    setIsAddingItem(true);
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}/inspection/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manufacturer:        newManufacturer.trim() || null,
          model:               newModel.trim() || null,
          serial_number:       newSerial.trim(),
          quantity:            newQty,
          visual_condition:    newVisual || null,
          packaging_condition: newPackaging || null,
          damage_notes:        newDamageNotes.trim() || null,
          disposition:         newDisposition || null,
        }),
      });
      if (res.ok) {
        setNewManufacturer(''); setNewModel(''); setNewSerial('');
        setNewQty(1); setNewVisual(''); setNewPackaging('');
        setNewDamageNotes(''); setNewDisposition('');
        fetchInspection();
      }
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    await apiFetch(`/api/shipments/${shipmentId}/inspection/items/${itemId}`, { method: 'DELETE' });
    fetchInspection();
  };

  const handleSubmit = async () => {
    if (!overallDisposition) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}/inspection/submit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overall_disposition: overallDisposition, notes: submissionNotes }),
      });
      if (res.ok) {
        const data = await res.json();
        onStatusChange(data.shipment_status);
        fetchInspection();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (action: 'approve' | 'reinspect') => {
    setIsResolving(true);
    try {
      const res = await apiFetch(`/api/shipments/${shipmentId}/inspection/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        onStatusChange(data.shipment_status);
        fetchInspection();
      }
    } finally {
      setIsResolving(false);
    }
  };

  const inputClass = "bg-base border border-subtle p-2 font-mono text-xs text-text-primary focus:border-accent-primary outline-none transition-all placeholder:opacity-30 w-full";
  const labelClass = "font-mono text-[9px] text-text-muted uppercase tracking-widest mb-1 block";

  const PassFailToggle = ({
    value, onChange,
  }: { value: 'Pass' | 'Fail' | ''; onChange: (v: 'Pass' | 'Fail') => void }) => (
    <div className="flex gap-1">
      {(['Pass', 'Fail'] as const).map(v => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`font-mono text-[9px] border px-2 py-1 transition-colors ${
            value === v
              ? v === 'Pass' ? 'border-status-ok bg-status-ok/10 text-status-ok'
                             : 'border-status-danger bg-status-danger/10 text-status-danger'
              : 'border-subtle text-text-muted hover:border-text-muted'
          }`}
        >
          {v.toUpperCase()}
        </button>
      ))}
    </div>
  );

  const showAssignUI = isAdmin && !inspection && shipmentStatus === 'Pending';
  const showPanel    = !!inspection || showAssignUI;
  if (!showPanel) return null;

  return (
    <section className="border border-subtle">
      {/* Panel header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-subtle bg-surface">
        <span className="font-mono text-[9px] text-accent-primary uppercase tracking-widest">
          QA_INSPECTION
        </span>
        <div className="flex-1 h-px bg-subtle" />
        {inspection && (
          <span className={`font-mono text-[9px] uppercase tracking-widest ${INSPECTION_STATUS_STYLE[inspection.status] ?? 'text-text-muted'}`}>
            {inspection.status.toUpperCase().replace(/ /g, '_')}
          </span>
        )}
      </div>

      <div className="p-6 flex flex-col gap-6">

        {/* ── Admin: assign QA inspector ── */}
        {showAssignUI && (
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[9px] text-text-muted tracking-widest uppercase">
              ASSIGN_QA_INSPECTOR
            </p>
            {qaUsers.length === 0 ? (
              <p className="font-mono text-xs text-status-warn">
                [!] No QA Inspectors found — create one in Settings first.
              </p>
            ) : (
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className={labelClass}>SELECT INSPECTOR</label>
                  <select
                    value={selectedQaId}
                    onChange={e => setSelectedQaId(e.target.value)}
                    className={inputClass}
                  >
                    {qaUsers.map(u => (
                      <option key={u.user_id} value={u.user_id}>{u.email}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAssign}
                  disabled={isAssigning || !selectedQaId}
                  className="btn-industrial py-2 px-6 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
                >
                  {isAssigning ? <span className="animate-pulse">ASSIGNING...</span> : 'ASSIGN'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Assigned inspector info ── */}
        {inspection && (
          <div className="flex flex-wrap gap-6">
            <div>
              <p className={labelClass}>ASSIGNED_INSPECTOR</p>
              <p className="font-mono text-xs text-text-primary">{inspection.assigned_qa_email}</p>
            </div>
            {inspection.completed_at && (
              <div>
                <p className={labelClass}>COMPLETED</p>
                <p className="font-mono text-xs text-text-primary">
                  {new Date(inspection.completed_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  })}
                </p>
              </div>
            )}
            {inspection.overall_disposition && (
              <div>
                <p className={labelClass}>VERDICT</p>
                <span className={`font-mono text-xs border px-2 py-0.5 ${DISPOSITION_STYLE[inspection.overall_disposition]}`}>
                  {inspection.overall_disposition.toUpperCase().replace(/ /g, '_')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Admin: QA Hold resolution ── */}
        {isAdmin && shipmentStatus === 'QA Hold' && inspection && (
          <div className="border border-status-danger/40 bg-status-danger/5 p-4 flex flex-col gap-3">
            <p className="font-mono text-[9px] text-status-danger tracking-widest uppercase">
              [!] QA_HOLD // ADMIN_ACTION_REQUIRED
            </p>
            {inspection.notes && (
              <p className="font-mono text-xs text-text-muted">{inspection.notes}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => handleResolve('approve')}
                disabled={isResolving}
                className="font-mono text-xs border border-status-ok text-status-ok px-4 py-2 hover:bg-status-ok hover:text-base transition-colors disabled:opacity-40 tracking-widest"
              >
                {isResolving ? '...' : 'APPROVE_OVERRIDE'}
              </button>
              <button
                onClick={() => handleResolve('reinspect')}
                disabled={isResolving}
                className="font-mono text-xs border border-status-warn text-status-warn px-4 py-2 hover:bg-status-warn hover:text-base transition-colors disabled:opacity-40 tracking-widest"
              >
                {isResolving ? '...' : 'SEND_BACK_TO_QA'}
              </button>
            </div>
          </div>
        )}

        {/* ── QA Inspector: start inspection ── */}
        {isQAInspector && shipmentStatus === 'Pending Inspection' && inspection && (
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="btn-industrial py-3 self-start disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
          >
            {isStarting ? <span className="animate-pulse">STARTING...</span> : 'START_INSPECTION'}
          </button>
        )}

        {/* ── Checklist items table ── */}
        {inspection && inspection.items.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className={labelClass}>
              CHECKLIST // {inspection.items.length} UNIT{inspection.items.length !== 1 ? 'S' : ''}
            </p>
            <div className="border border-subtle overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-subtle">
                    {['SERIAL_#', 'MANUFACTURER', 'MODEL', 'QTY', 'VISUAL', 'PACKAGING', 'DISPOSITION', 'NOTES', ''].map(h => (
                      <th key={h} className="font-mono text-[8px] text-text-muted tracking-widest px-3 py-2 uppercase whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inspection.items.map(item => (
                    <tr key={item.item_id} className="border-b border-subtle last:border-0">
                      <td className="font-mono text-[10px] text-text-primary px-3 py-2 whitespace-nowrap">{item.serial_number ?? '—'}</td>
                      <td className="font-mono text-[10px] text-text-muted px-3 py-2 whitespace-nowrap">{item.manufacturer ?? '—'}</td>
                      <td className="font-mono text-[10px] text-text-muted px-3 py-2 whitespace-nowrap">{item.model ?? '—'}</td>
                      <td className="font-mono text-[10px] text-text-muted px-3 py-2 text-center">{item.quantity}</td>
                      <td className="px-3 py-2">
                        {item.visual_condition
                          ? <span className={`font-mono text-[9px] ${item.visual_condition === 'Pass' ? 'text-status-ok' : 'text-status-danger'}`}>{item.visual_condition.toUpperCase()}</span>
                          : <span className="text-text-muted/40 font-mono text-[9px]">—</span>}
                      </td>
                      <td className="px-3 py-2">
                        {item.packaging_condition
                          ? <span className={`font-mono text-[9px] ${item.packaging_condition === 'Pass' ? 'text-status-ok' : 'text-status-danger'}`}>{item.packaging_condition.toUpperCase()}</span>
                          : <span className="text-text-muted/40 font-mono text-[9px]">—</span>}
                      </td>
                      <td className="px-3 py-2">
                        {item.disposition
                          ? <span className={`font-mono text-[9px] ${item.disposition === 'Pass' ? 'text-status-ok' : item.disposition === 'Fail' ? 'text-status-danger' : 'text-status-warn'}`}>{item.disposition.toUpperCase().replace(/ /g, '_')}</span>
                          : <span className="text-text-muted/40 font-mono text-[9px]">—</span>}
                      </td>
                      <td className="font-mono text-[9px] text-text-muted px-3 py-2 max-w-[160px] truncate">{item.damage_notes ?? '—'}</td>
                      <td className="px-3 py-2">
                        {isQAInspector && shipmentStatus === 'Under Inspection' && (
                          <button
                            onClick={() => handleDeleteItem(item.item_id)}
                            className="font-mono text-[8px] text-text-muted hover:text-status-danger transition-colors tracking-widest"
                          >
                            [REMOVE]
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── QA Inspector: add unit form ── */}
        {isQAInspector && shipmentStatus === 'Under Inspection' && (
          <div className="border border-subtle p-4 flex flex-col gap-4">
            <p className={labelClass}>ADD_UNIT</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>SERIAL_# *</label>
                <input value={newSerial} onChange={e => setNewSerial(e.target.value)} className={inputClass} placeholder="SN-00001" />
              </div>
              <div>
                <label className={labelClass}>MANUFACTURER</label>
                <input value={newManufacturer} onChange={e => setNewManufacturer(e.target.value)} className={inputClass} placeholder="Dell" />
              </div>
              <div>
                <label className={labelClass}>MODEL</label>
                <input value={newModel} onChange={e => setNewModel(e.target.value)} className={inputClass} placeholder="PowerEdge R740" />
              </div>
              <div>
                <label className={labelClass}>QTY</label>
                <input type="number" min={1} value={newQty} onChange={e => setNewQty(Number(e.target.value))} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>VISUAL_CONDITION</label>
                <PassFailToggle value={newVisual} onChange={setNewVisual} />
              </div>
              <div>
                <label className={labelClass}>PACKAGING_CONDITION</label>
                <PassFailToggle value={newPackaging} onChange={setNewPackaging} />
              </div>
              <div>
                <label className={labelClass}>DISPOSITION</label>
                <select value={newDisposition} onChange={e => setNewDisposition(e.target.value)} className={inputClass}>
                  <option value="">SELECT...</option>
                  <option value="Pass">PASS</option>
                  <option value="Fail">FAIL</option>
                  <option value="Use-as-is">USE-AS-IS</option>
                  <option value="Return to Vendor">RETURN TO VENDOR</option>
                  <option value="Scrap">SCRAP</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>DAMAGE_NOTES</label>
                <input value={newDamageNotes} onChange={e => setNewDamageNotes(e.target.value)} className={inputClass} placeholder="Optional" />
              </div>
            </div>
            <button
              onClick={handleAddItem}
              disabled={isAddingItem || !newSerial.trim()}
              className="btn-industrial self-start py-2 px-6 text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
            >
              {isAddingItem ? <span className="animate-pulse">ADDING...</span> : 'ADD_UNIT'}
            </button>
          </div>
        )}

        {/* ── QA Inspector: submit verdict ── */}
        {isQAInspector && shipmentStatus === 'Under Inspection' && (
          <div className="border border-subtle p-4 flex flex-col gap-4">
            <p className={labelClass}>INSPECTOR_VERDICT</p>
            <div className="flex flex-wrap gap-2">
              {(['Pass', 'Fail', 'QA Hold', 'Conditional'] as QADisposition[]).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setOverallDisposition(d)}
                  className={`font-mono text-[10px] border px-4 py-2 transition-colors tracking-widest ${
                    overallDisposition === d
                      ? DISPOSITION_STYLE[d]
                      : 'border-subtle text-text-muted hover:border-text-muted'
                  }`}
                >
                  {d.toUpperCase().replace(/ /g, '_')}
                </button>
              ))}
            </div>
            <div>
              <label className={labelClass}>INSPECTION_NOTES</label>
              <textarea
                value={submissionNotes}
                onChange={e => setSubmissionNotes(e.target.value)}
                rows={3}
                placeholder="Summary of findings, issues found, recommendations..."
                className={`${inputClass} resize-none`}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !overallDisposition}
              className="btn-industrial self-start py-3 px-8 disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
            >
              {isSubmitting ? <span className="animate-pulse">SUBMITTING...</span> : 'SUBMIT_INSPECTION'}
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
