import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { name: 'DASHBOARD', path: '/' },
  { name: 'ACTIVE_LOGS', path: '/logs' },
  { name: 'SCAN_CARGO', path: '/scan' },
  { name: 'SETTINGS', path: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-surface border-r border-subtle flex flex-col h-screen sticky top-0">
      <div className="p-8 mb-4">
        <div className="text-accent-primary font-display text-3xl tracking-tighter">
          SERVERSEAL_SYS
        </div>
        <div className="font-mono text-[10px] text-text-muted mt-1 uppercase tracking-widest">
          Auth_Level: Admin
        </div>
      </div>

      <nav className="flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-8 py-4 font-mono text-xs tracking-[0.2em] transition-all group
                ${isActive 
                  ? 'border-l-4 border-accent-primary bg-accent-primary/5 text-text-primary' 
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                }`}
            >
              {isActive ? `> ${item.name}` : item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-8 border-t border-subtle">
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