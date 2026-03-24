import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ShipmentDetail from './pages/ShipmentDetail';
import ActiveLogs from './pages/ActiveLogs';
import ScanCargo from './pages/ScanCargo';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import './index.css';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-base text-text-primary">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/shipments/:id" element={<ShipmentDetail />} />
            <Route path="/logs" element={<ActiveLogs />} />
            <Route path="/scan" element={<ScanCargo />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
