import { useState, useEffect } from 'react';
import Toast from '../components/Toast';

// Keys used in localStorage — keeping them in one place makes future migration to
// a real user account (Step 4) easier to find and update.
const STORAGE_KEYS = {
  handlerId: 'handlerId',
  notifyStatusChange: 'settings.notify.statusChange',
  notifyException: 'settings.notify.exception',
  notifyEmail: 'settings.notify.email',
};

export default function Settings() {
  const [handlerId, setHandlerId] = useState('');
  const [handlerDraft, setHandlerDraft] = useState('');
  const [isEditingHandler, setIsEditingHandler] = useState(false);

  const [notifyStatusChange, setNotifyStatusChange] = useState(false);
  const [notifyException, setNotifyException] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const [toast, setToast] = useState({ isVisible: false, message: '' });

  // Load all settings from localStorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.handlerId) || '';
    const savedStatusChange = localStorage.getItem(STORAGE_KEYS.notifyStatusChange) === 'true';
    const savedException = localStorage.getItem(STORAGE_KEYS.notifyException) !== 'false'; // default true
    const savedEmail = localStorage.getItem(STORAGE_KEYS.notifyEmail) || '';

    setHandlerId(savedId);
    setHandlerDraft(savedId);
    setNotifyStatusChange(savedStatusChange);
    setNotifyException(savedException);
    setNotifyEmail(savedEmail);
    setEmailDraft(savedEmail);
  }, []);

  const showToast = (message: string) => {
    setToast({ isVisible: true, message });
  };

  const saveHandlerId = () => {
    const trimmed = handlerDraft.trim();
    localStorage.setItem(STORAGE_KEYS.handlerId, trimmed);
    setHandlerId(trimmed);
    setIsEditingHandler(false);
    showToast(`HANDLER_ID_UPDATED // ${trimmed || 'CLEARED'}`);
  };

  const saveEmail = () => {
    const trimmed = emailDraft.trim();
    localStorage.setItem(STORAGE_KEYS.notifyEmail, trimmed);
    setNotifyEmail(trimmed);
    setIsEditingEmail(false);
    showToast('NOTIFICATION_EMAIL_SAVED');
  };

  const toggleStatusChange = () => {
    const next = !notifyStatusChange;
    setNotifyStatusChange(next);
    localStorage.setItem(STORAGE_KEYS.notifyStatusChange, String(next));
    showToast(`STATUS_CHANGE_ALERTS: ${next ? 'ENABLED' : 'DISABLED'}`);
  };

  const toggleException = () => {
    const next = !notifyException;
    setNotifyException(next);
    localStorage.setItem(STORAGE_KEYS.notifyException, String(next));
    showToast(`EXCEPTION_ALERTS: ${next ? 'ENABLED' : 'DISABLED'}`);
  };

  return (
    <div className="p-8 flex flex-col gap-10 max-w-3xl">

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      <header className="border-b border-subtle pb-6">
        <h1 className="font-display text-7xl text-accent-primary tracking-tighter leading-none uppercase">
          SYS_SETTINGS
        </h1>
        <p className="font-mono text-xs text-text-muted mt-2 tracking-[0.2em]">
          CONFIGURATION // LOCAL_PREFERENCES // <span className="text-status-ok">CHANGES_SAVED_LOCALLY</span>
        </p>
      </header>

      {/* ── Handler Profile ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-[9px] text-accent-primary uppercase tracking-widest">
            HANDLER_PROFILE
          </span>
          <div className="flex-1 h-px bg-subtle" />
        </div>

        <div className="border border-subtle bg-surface p-6 flex flex-col gap-4">
          <p className="font-mono text-[10px] text-text-muted leading-relaxed">
            Your Handler ID is attached to every event you log. It identifies who performed each
            action in the chain-of-custody record. This will be replaced by your account login
            once authentication is added.
          </p>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-[9px] text-text-muted uppercase tracking-widest">
              HANDLER_ID
            </label>

            {isEditingHandler ? (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={handlerDraft}
                  onChange={e => setHandlerDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveHandlerId()}
                  placeholder="e.g. DRV-001 or your initials"
                  autoFocus
                  className="flex-1 bg-base border border-accent-primary/40 text-text-primary font-mono text-sm px-4 py-3 focus:outline-none focus:border-accent-primary placeholder:text-text-muted/40 tracking-wider"
                />
                <button onClick={saveHandlerId} className="btn-industrial">SAVE</button>
                <button
                  onClick={() => { setHandlerDraft(handlerId); setIsEditingHandler(false); }}
                  className="border border-subtle text-text-muted font-mono text-xs tracking-[0.2em] px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1 border border-subtle px-4 py-3">
                  <span className={`font-mono text-sm tracking-wider ${handlerId ? 'text-text-primary' : 'text-text-muted/40'}`}>
                    {handlerId || 'NOT_SET'}
                  </span>
                </div>
                <button
                  onClick={() => setIsEditingHandler(true)}
                  className="border border-subtle text-text-muted font-mono text-xs tracking-[0.2em] px-4 py-3 hover:border-accent-primary/40 hover:text-text-primary transition-colors"
                >
                  EDIT
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Notifications ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-[9px] text-accent-primary uppercase tracking-widest">
            NOTIFICATIONS
          </span>
          <div className="flex-1 h-px bg-subtle" />
        </div>

        <div className="border border-subtle bg-surface p-6 flex flex-col gap-6">
          <p className="font-mono text-[10px] text-text-muted leading-relaxed">
            All notifications are optional. Email delivery will be active once the notification
            system is connected in a future update. Your preferences are saved now and will apply
            when that feature ships.
          </p>

          {/* Email address */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[9px] text-text-muted uppercase tracking-widest">
              NOTIFICATION_EMAIL
            </label>
            {isEditingEmail ? (
              <div className="flex gap-3">
                <input
                  type="email"
                  value={emailDraft}
                  onChange={e => setEmailDraft(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEmail()}
                  placeholder="you@example.com"
                  autoFocus
                  className="flex-1 bg-base border border-accent-primary/40 text-text-primary font-mono text-sm px-4 py-3 focus:outline-none focus:border-accent-primary placeholder:text-text-muted/40"
                />
                <button onClick={saveEmail} className="btn-industrial">SAVE</button>
                <button
                  onClick={() => { setEmailDraft(notifyEmail); setIsEditingEmail(false); }}
                  className="border border-subtle text-text-muted font-mono text-xs tracking-[0.2em] px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1 border border-subtle px-4 py-3">
                  <span className={`font-mono text-sm ${notifyEmail ? 'text-text-primary' : 'text-text-muted/40'}`}>
                    {notifyEmail || 'NOT_SET'}
                  </span>
                </div>
                <button
                  onClick={() => setIsEditingEmail(true)}
                  className="border border-subtle text-text-muted font-mono text-xs tracking-[0.2em] px-4 py-3 hover:border-accent-primary/40 hover:text-text-primary transition-colors"
                >
                  EDIT
                </button>
              </div>
            )}
          </div>

          {/* Toggle rows */}
          <div className="flex flex-col gap-0 border border-subtle">
            <ToggleRow
              label="STATUS_CHANGE_ALERTS"
              description="Notify when a shipment moves to a new status (Sealed, In Transit, Delivered)"
              enabled={notifyStatusChange}
              onToggle={toggleStatusChange}
            />
            <ToggleRow
              label="EXCEPTION_ALERTS"
              description='Notify immediately when an "Exception" event is logged on any shipment'
              enabled={notifyException}
              onToggle={toggleException}
              isLast
            />
          </div>
        </div>
      </section>

      {/* ── System Info ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-[9px] text-accent-primary uppercase tracking-widest">
            SYSTEM_INFO
          </span>
          <div className="flex-1 h-px bg-subtle" />
        </div>

        <div className="border border-subtle bg-surface p-6">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <InfoRow label="APP_VERSION" value="v1.0.4-STABLE" />
            <InfoRow label="NODE_ID" value="SD-NORTH-04" />
            <InfoRow label="DATABASE" value="PostgreSQL (Local)" />
            <InfoRow label="STORAGE" value="Local (AWS S3 pending)" />
            <InfoRow label="AUTH" value="Not configured (Step 4)" dimmed />
            <InfoRow label="ENVIRONMENT" value="Development" />
          </div>
        </div>
      </section>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
  isLast = false,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  isLast?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-6 px-5 py-4 ${!isLast ? 'border-b border-subtle' : ''}`}>
      <div className="flex flex-col gap-1">
        <span className="font-mono text-xs text-text-primary tracking-widest">{label}</span>
        <span className="font-mono text-[9px] text-text-muted">{description}</span>
      </div>
      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-12 h-6 border transition-colors relative ${
          enabled
            ? 'border-status-ok bg-status-ok/10'
            : 'border-subtle bg-transparent'
        }`}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 transition-all font-mono text-[8px] flex items-center justify-center ${
            enabled
              ? 'left-[calc(100%-1.375rem)] bg-status-ok text-base'
              : 'left-0.5 bg-subtle text-text-muted'
          }`}
        >
          {enabled ? 'ON' : 'OF'}
        </span>
      </button>
    </div>
  );
}

function InfoRow({ label, value, dimmed = false }: { label: string; value: string; dimmed?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">{label}</span>
      <span className={`font-mono text-xs tracking-wider ${dimmed ? 'text-text-muted/50' : 'text-text-primary'}`}>
        {value}
      </span>
    </div>
  );
}
