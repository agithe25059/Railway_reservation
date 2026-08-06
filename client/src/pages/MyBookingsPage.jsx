import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/auth';
import '../styles/booking.css';

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // PNR Search State
  const [searchPnr, setSearchPnr] = useState('');
  const [pnrResult, setPnrResult] = useState(null);
  const [pnrLoading, setPnrLoading] = useState(false);
  const [pnrError, setPnrError] = useState('');

  const user = JSON.parse(localStorage.getItem('rr_user') || '{}');

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/my-bookings');
      setBookings(res.data.bookings);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handlePnrSearch = async (e) => {
    e.preventDefault();
    if (!searchPnr || searchPnr.trim().length !== 10) {
      return setPnrError('Please enter a valid 10-digit PNR number.');
    }

    setPnrError(''); setPnrLoading(true); setPnrResult(null);
    try {
      const res = await api.get(`/bookings/pnr/${searchPnr.trim()}`);
      setPnrResult(res.data.booking);
    } catch (err) {
      setPnrError(err.response?.data?.message || 'PNR not found.');
    } finally {
      setPnrLoading(false);
    }
  };

  return (
    <div className="booking-page">
      {/* Top Navbar */}
      <header className="booking-nav">
        <div className="booking-nav-left" onClick={() => navigate('/trains')}>
          <span className="brand-icon">🚂</span>
          <span className="brand-name">RailConnect</span>
        </div>
        <div className="booking-nav-right">
          <button className="nav-bookings-btn" onClick={() => navigate('/trains')}>🚆 Search Trains</button>
          <span className="user-name">👤 {user.full_name || 'User'}</span>
        </div>
      </header>

      <main className="my-bookings-container">
        {/* PNR Search Card */}
        <div className="pnr-search-card">
          <h2>🔍 Quick PNR Status Lookup</h2>
          <form className="pnr-search-form" onSubmit={handlePnrSearch}>
            <input
              type="text"
              className="pnr-input"
              placeholder="Enter 10-digit PNR Number"
              maxLength={10}
              value={searchPnr}
              onChange={e => setSearchPnr(e.target.value.replace(/\D/g, ''))}
            />
            <button type="submit" className="pnr-search-btn" disabled={pnrLoading}>
              {pnrLoading ? 'Searching…' : 'Check Status'}
            </button>
          </form>

          {pnrError && <div className="pnr-error-msg">⚠️ {pnrError}</div>}

          {/* Searched PNR Result */}
          {pnrResult && (
            <div className="pnr-result-box">
              <div className="pnr-res-head">
                <span>PNR: <b>{pnrResult.pnr}</b></span>
                <span className="status-badge-conf">{pnrResult.booking_status}</span>
              </div>
              <div className="pnr-res-body">
                <div><strong>Train:</strong> {pnrResult.train_name} (#{pnrResult.train_number})</div>
                <div><strong>Route:</strong> {pnrResult.source_name} ({pnrResult.source_code}) → {pnrResult.dest_name} ({pnrResult.dest_code})</div>
                <div><strong>Date & Class:</strong> {pnrResult.travel_date} · {pnrResult.class_code}</div>
                <div><strong>Passengers:</strong> {pnrResult.passengers?.map(p => `${p.name} (${p.seat_number})`).join(', ')}</div>
              </div>
            </div>
          )}
        </div>

        {/* My Bookings List */}
        <div className="my-bookings-section">
          <h2>🎟 My Booked Tickets ({bookings.length})</h2>

          {loading && (
            <div className="booking-page-loading">
              <div className="loading-spinner-train">🚂</div>
              <p>Loading your tickets…</p>
            </div>
          )}

          {!loading && error && (
            <div className="booking-page-error">
              <p>⚠️ {error}</p>
            </div>
          )}

          {!loading && bookings.length === 0 && !error && (
            <div className="no-bookings-card">
              <span className="no-b-icon">🎫</span>
              <h3>No Booked Tickets Yet</h3>
              <p>Search for trains and book your tickets easily!</p>
              <button className="action-btn-primary" onClick={() => navigate('/trains')}>
                🔍 Search Trains Now
              </button>
            </div>
          )}

          {!loading && bookings.length > 0 && (
            <div className="bookings-list">
              {bookings.map(b => (
                <div key={b.id} className="ticket-card-item">
                  <div className="ticket-item-top">
                    <div>
                      <span className="ticket-pnr">PNR: <b>{b.pnr}</b></span>
                      <h3 className="ticket-train-title">{b.train_name} <span className="t-num">#{b.train_number}</span></h3>
                    </div>
                    <div className="ticket-status-col">
                      <span className="status-badge-conf">{b.booking_status}</span>
                      <span className="ticket-fare-txt">₹{Number(b.total_fare).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="ticket-route-row">
                    <div className="t-station">
                      <span className="t-time">{b.departure_time?.slice(0,5)}</span>
                      <span className="t-code">{b.source_code}</span>
                      <span className="t-name">{b.source_name}</span>
                    </div>
                    <div className="t-arrow">
                      <span>{b.duration}</span>
                      <div className="t-line" />
                    </div>
                    <div className="t-station">
                      <span className="t-time">{b.arrival_time?.slice(0,5)}</span>
                      <span className="t-code">{b.dest_code}</span>
                      <span className="t-name">{b.dest_name}</span>
                    </div>
                    <div className="t-meta">
                      <div><strong>Date:</strong> {b.travel_date}</div>
                      <div><strong>Class:</strong> {b.class_code}</div>
                      <div><strong>Mobile:</strong> {b.contact_phone}</div>
                    </div>
                  </div>

                  {/* Passenger Table */}
                  <div className="ticket-passengers-box">
                    <h4>Passengers ({b.passengers?.length})</h4>
                    <div className="passengers-pills">
                      {b.passengers?.map((p, idx) => (
                        <div key={idx} className="passenger-pill">
                          <span className="p-name">{p.name} ({p.age}/{p.gender})</span>
                          <span className="p-seat">{p.seat_number}</span>
                          <span className="p-berth">{p.berth_preference}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
