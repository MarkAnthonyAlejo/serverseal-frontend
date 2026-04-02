import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const navItems = [
  { name: 'DASHBOARD',   path: '/' },
  { name: 'ACTIVE_LOGS', path: '/logs' },
  { name: 'SCAN_CARGO',  path: '/scan' },
  { name: 'ALERTS',      path: '/alerts' },
  { name: 'SETTINGS',    path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-surface border-r border-subtle flex flex-col h-screen sticky top-0">
      <div className="p-8 mb-4">
        <div className="text-accent-primary font-display text-3xl tracking-tighter">
          SERVERSEAL_SYS
        </div>
        <div className="font-mono text-[10px] text-text-muted mt-1 uppercase tracking-widest">
          AUTH_LEVEL: {user?.role ?? '—'}
        </div>
      </div>

      <nav className="flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showBadge = item.path === '/alerts' && unreadCount > 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-8 py-4 font-mono text-xs tracking-[0.2em] transition-all group
                ${isActive
                  ? 'border-l-4 border-accent-primary bg-accent-primary/5 text-text-primary'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                }`}
            >
              <span>{isActive ? `> ${item.name}` : item.name}</span>
              {showBadge && (
                <span className="font-mono text-[9px] bg-accent-primary text-base px-1.5 py-0.5 rounded-sm min-w-[18px] text-center leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-8 border-t border-subtle flex flex-col gap-4">
        <button
          onClick={handleLogout}
          className="btn-industrial btn-industrial-danger w-full"
        >
          LOGOUT
        </button>
        <div className="font-mono text-[9px] text-text-muted leading-relaxed">
          SYSTEM_STATUS: <span className="text-status-ok">NOMINAL</span>
          <br />
          NODE: SD-NORTH-04
          <br />
          v1.0.4-STABLE
        </div>
      </div>
    </aside>
  );
}
