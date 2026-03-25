import { useState, useEffect } from 'react';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

const STORAGE_KEYS = {
  notifyStatusChange: 'settings.notify.statusChange',
  notifyException:    'settings.notify.exception',
  notifyEmail:        'settings.notify.email',
};

interface UserRecord {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  // Notification prefs
  const [notifyStatusChange, setNotifyStatusChange] = useState(false);
  const [notifyException, setNotifyException]       = useState(true);
  const [notifyEmail, setNotifyEmail]               = useState('');
  const [emailDraft, setEmailDraft]                 = useState('');
  const [isEditingEmail, setIsEditingEmail]         = useState(false);

  // User management (Admin only)
  const [users, setUsers]               = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [newEmail, setNewEmail]         = useState('');
  const [newPassword, setNewPassword]   = useState('');
  const [newRole, setNewRole]           = useState<'Driver' | 'Client'>('Driver');
  const [createError, setCreateError]   = useState<string | null>(null);
  const [isCreating, setIsCreating]     = useState(false);

  const [toast, setToast] = useState({ isVisible: false, message: '' });

  const showToast = (message: string) => setToast({ isVisible: true, message });

  // Load notification prefs
  useEffect(() => {
    setNotifyStatusChange(localStorage.getItem(STORAGE_KEYS.notifyStatusChange) === 'true');
    setNotifyException(localStorage.getItem(STORAGE_KEYS.notifyException) !== 'false');
    const savedEmail = localStorage.getItem(STORAGE_KEYS.notifyEmail) || '';
    setNotifyEmail(savedEmail);
    setEmailDraft(savedEmail);
  }, []);

  // Load user list if Admin
  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin]);

  const fetchUsers = () => {
    setUsersLoading(true);
    apiFetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .finally(() => setUsersLoading(false));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setIsCreating(true);
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim().toLowerCase(), password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? 'CREATE_FAILED');
        return;
      }
      setNewEmail('');
      setNewPassword('');
      setNewRole('Driver');
      fetchUsers();
      showToast(`USER_CREATED // ${newEmail.trim().toLowerCase()}`);
    } catch {
      setCreateError('ERR_NETWORK_FAILURE');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    const res = await apiFetch(`/api/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      fetchUsers();
      showToast(`USER_REMOVED // ${email}`);
    }
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

  const inputClass = "w-full bg-base border border-subtle p-3 font-mono text-sm text-text-primary focus:border-accent-primary outline-none transition-all placeholder:opacity-30";
  const labelClass = "block font-mono text-[10px] text-accent-primary uppercase mb-2 tracking-widest";

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
          CONFIGURATION // SYSTEM_PREFERENCES // <span className="text-status-ok">AUTHENTICATED</span>
        </p>
      </header>

      {/* ── User Management (Admin only) ── */}
      {isAdmin && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-[9px] text-accent-primary uppercase tracking-widest">
              USER_MANAGEMENT
            </span>
            <div className="flex-1 h-px bg-subtle" />
            <span className="font-mono text-[9px] text-status-ok tracking-widest">ADMIN_ONLY</span>
          </div>

          {/* User list */}
          <div className="border border-subtle bg-surface">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-5 py-3 border-b border-subtle">
              <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">EMAIL</span>
              <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">ROLE</span>
              <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">ACTION</span>
            </div>

            {usersLoading ? (
              <p className="font-mono text-[10px] text-text-muted p-5 animate-pulse tracking-widest">
                LOADING_USERS...
              </p>
            ) : (
              users.map(u => (
                <div
                  key={u.user_id}
                  className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center px-5 py-4 border-b border-subtle last:border-0"
                >
                  <span className="font-mono text-xs text-text-primary truncate">{u.email}</span>
                  <span className={`font-mono text-[10px] border px-2 py-0.5 w-fit ${
                    u.role === 'Admin'  ? 'border-accent-primary text-accent-primary' :
                    u.role === 'Driver' ? 'border-status-warn text-status-warn' :
                    'border-subtle text-text-muted'
                  }`}>
                    {u.role.toUpperCase()}
                  </span>
                  {u.user_id === user?.user_id ? (
                    <span className="font-mono text-[9px] text-text-muted tracking-widest">YOU</span>
                  ) : (
                    <button
                      onClick={() => handleDeleteUser(u.user_id, u.email)}
                      className="font-mono text-[9px] text-text-muted border border-subtle px-3 py-1 hover:border-status-danger hover:text-status-danger transition-colors tracking-widest"
                    >
                      REMOVE
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Create user form */}
          <div className="border border-subtle bg-surface p-6 flex flex-col gap-4">
            <p className="font-mono text-[9px] text-accent-primary uppercase tracking-widest mb-1">
              ADD_NEW_USER
            </p>

            {createError && (
              <div className="border border-status-danger bg-status-danger/10 p-3 font-mono text-status-danger text-xs">
                [!] {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div>
                <label className={labelClass}>EMAIL</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className={inputClass}
                  placeholder="user@serverseal.io"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>TEMPORARY_PASSWORD</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>ROLE</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as 'Driver' | 'Client')}
                  className={inputClass}
                >
                  <option value="Driver">DRIVER</option>
                  <option value="Client">CLIENT</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isCreating || !newEmail || !newPassword}
                className={`btn-industrial py-3 transition-all duration-300 ${
                  (isCreating || !newEmail || !newPassword)
                    ? 'opacity-20 cursor-not-allowed grayscale'
                    : 'opacity-100'
                }`}
              >
                {isCreating ? <span className="animate-pulse">CREATING_USER...</span> : 'CREATE_USER'}
              </button>
            </form>
          </div>
        </section>
      )}

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
            <InfoRow label="AUTH" value={`JWT // ${user?.role?.toUpperCase() ?? '—'}`} />
            <InfoRow label="ENVIRONMENT" value="Development" />
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ToggleRow({
  label, description, enabled, onToggle, isLast = false,
}: {
  label: string; description: string; enabled: boolean; onToggle: () => void; isLast?: boolean;
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
          enabled ? 'border-status-ok bg-status-ok/10' : 'border-subtle bg-transparent'
        }`}
      >
        <span className={`absolute top-0.5 w-5 h-5 transition-all font-mono text-[8px] flex items-center justify-center ${
          enabled ? 'left-[calc(100%-1.375rem)] bg-status-ok text-base' : 'left-0.5 bg-subtle text-text-muted'
        }`}>
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
