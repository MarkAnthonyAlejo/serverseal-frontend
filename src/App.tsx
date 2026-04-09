import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ShipmentDetail from './pages/ShipmentDetail';
import ActiveLogs from './pages/ActiveLogs';
import ScanCargo from './pages/ScanCargo';
import Settings from './pages/Settings';
import Alerts from './pages/Alerts';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import './index.css';

function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-base text-text-primary">
      {/* Backdrop — mobile only, closes sidebar on tap */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-20 bg-surface border-b border-subtle flex items-center justify-between px-4 h-14 shrink-0">
          <span className="text-accent-primary font-display text-2xl tracking-tighter leading-none">
            SERVERSEAL_SYS
          </span>
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col gap-[5px] p-2"
            aria-label="Open navigation"
          >
            <span className="w-5 h-0.5 bg-text-primary block" />
            <span className="w-5 h-0.5 bg-text-primary block" />
            <span className="w-5 h-0.5 bg-text-primary block" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
      <Router>
        <Routes>
          {/* Public route — no sidebar */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes — require auth + render with sidebar */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell><Dashboard /></AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipments/:id"
            element={
              <ProtectedRoute>
                <AppShell><ShipmentDetail /></AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute>
                <AppShell><ActiveLogs /></AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scan"
            element={
              <ProtectedRoute>
                <AppShell><ScanCargo /></AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AppShell><Settings /></AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <AppShell><Alerts /></AppShell>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
