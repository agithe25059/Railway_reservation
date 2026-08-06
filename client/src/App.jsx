import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TrainSearchPage from './pages/TrainSearchPage';
import TrainDetailsPage from './pages/TrainDetailsPage';
import MyBookingsPage from './pages/MyBookingsPage';

// Auth guard
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('rr_token');
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Dashboard → redirect to train search */}
        <Route path="/dashboard" element={
          <PrivateRoute><Navigate to="/trains" replace /></PrivateRoute>
        } />

        {/* Train Search */}
        <Route path="/trains" element={
          <PrivateRoute><TrainSearchPage /></PrivateRoute>
        } />

        {/* Train Details & Seat Booking */}
        <Route path="/trains/:number" element={
          <PrivateRoute><TrainDetailsPage /></PrivateRoute>
        } />

        {/* My Bookings & PNR Status */}
        <Route path="/my-bookings" element={
          <PrivateRoute><MyBookingsPage /></PrivateRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
