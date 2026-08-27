import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from './store/authStore';
import { ToastContainer, Toast as ToastType } from './components/ui/Toast';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Patients from './pages/Patients';
import Examinations from './pages/Examinations';
import Prescriptions from './pages/Prescriptions';
import OpticalSales from './pages/OpticalSales';
import Inventory from './pages/Inventory';
import Payments from './pages/Payments';
import FollowUps from './pages/FollowUps';
import Analytics from './pages/Analytics';
import Appointments from './pages/Appointments';
import Suppliers from './pages/Suppliers';
import Expenses from './pages/Expenses';
import Staff from './pages/Staff';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import SpectacleOrders from './pages/SpectacleOrders';
import Reports from './pages/Reports';

function App() {
  const { token, initializeAuth } = useAuthStore();
  const [toasts, setToasts] = useState<ToastType[]>([]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Listen for toast events
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setToasts((prev) => [...prev, detail]);
    };
    window.addEventListener('toast', handler);
    return () => window.removeEventListener('toast', handler);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {token ? (
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/examinations" element={<Examinations />} />
              <Route path="/prescriptions" element={<Prescriptions />} />
              <Route path="/sales" element={<OpticalSales />} />
              <Route path="/spectacle-orders" element={<SpectacleOrders />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/follow-ups" element={<FollowUps />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}
        </Routes>
      </Router>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default App;
