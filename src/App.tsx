import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import './index.css';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-base text-text-primary">
        {/* The Sidebar is now visible on every page */}
        <Sidebar />

        {/* This main area swaps out content based on the Route */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {/* Future routes like <Route path="/scan" element={<Scanner />} /> go here */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;