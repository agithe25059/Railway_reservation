import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Simple auth guard
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('rr_token');
  return token ? children : <Navigate to="/login" replace />;
};

// Temp dashboard placeholder
const Dashboard = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: '#0d1117', color: '#e6edf3',
    fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', flexDirection: 'column', gap: '1rem'
  }}>
    <span style={{ fontSize: '3rem' }}>🚂</span>
    <h2>Welcome to RailConnect!</h2>
    <p style={{ color: '#8d96a0', fontSize: '1rem' }}>Dashboard coming soon...</p>
    <button
      onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
      style={{
        padding: '0.6rem 1.5rem', background: '#3b82f6', color: 'white',
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem'
      }}
    >
      Logout
    </button>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
