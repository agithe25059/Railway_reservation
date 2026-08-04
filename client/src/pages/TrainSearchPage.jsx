import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/auth';
import '../styles/trains.css';

export default function TrainSearchPage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [fromSelected, setFromSelected] = useState(null);
  const [toSelected, setToSelected] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const fromRef = useRef(null);
  const toRef = useRef(null);

  const searchStations = async (query, setter) => {
    if (query.length < 2) return setter([]);
    try {
      const res = await api.get(`/stations/search?q=${query}`);
      setter(res.data.stations);
    } catch { setter([]); }
  };

  useEffect(() => { searchStations(from, setFromSuggestions); }, [from]);
  useEffect(() => { searchStations(to, setToSuggestions); }, [to]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!fromSelected || !toSelected) return setError('Please select stations from the suggestions.');
    if (fromSelected.code === toSelected.code) return setError('Source and destination cannot be the same.');
    setError(''); setLoading(true); setSearched(true);
    try {
      const res = await api.get(`/trains/search?from=${fromSelected.code}&to=${toSelected.code}&date=${date}`);
      setResults(res.data.trains);
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed. Try again.');
      setResults([]);
    } finally { setLoading(false); }
  };

  const getDayLabels = (days) => {
    const map = { '1':'Mon','2':'Tue','3':'Wed','4':'Thu','5':'Fri','6':'Sat','7':'Sun' };
    return days.split('').map(d => map[d] || d).join(', ');
  };

  const getTypeColor = (type) => {
    const colors = {
      'Rajdhani': '#e63946', 'Shatabdi': '#3a86ff', 'Duronto': '#fb5607',
      'Vande Bharat': '#8338ec', 'Superfast': '#06d6a0', 'Express': '#ffd166',
      'Mail': '#ffd166', 'Passenger': '#adb5bd', 'Local': '#adb5bd'
    };
    return colors[type] || '#adb5bd';
  };

  const getTypeImage = (type) => {
    const map = { 'Rajdhani': '/trains/rajdhani.png', 'Shatabdi': '/trains/shatabdi.png',
      'Duronto': '/trains/duronto.png', 'Vande Bharat': '/trains/vande_bharat.png' };
    return map[type] || '/trains/express.png';
  };

  const user = JSON.parse(localStorage.getItem('rr_user') || '{}');

  return (
    <div className="train-page">
      {/* ── Topbar ── */}
      <header className="train-header">
        <div className="train-header-left">
          <span className="train-logo">🚂</span>
          <span className="train-brand">RailConnect</span>
        </div>
        <div className="train-header-right">
          <span className="user-greeting">👤 {user.full_name || 'User'}</span>
          <button className="logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</button>
        </div>
      </header>

      {/* ── Hero Search ── */}
      <section className="search-hero">
        <div className="search-hero-text">
          <h1>Find Your Train</h1>
          <p>Search from 10,000+ trains across India</p>
        </div>

        <form className="search-card" onSubmit={handleSearch} id="train-search-form">
          {error && <div className="search-error">⚠️ {error}</div>}
          <div className="search-row">
            {/* FROM */}
            <div className="station-input-group" ref={fromRef}>
              <label>FROM</label>
              <div className="station-input-wrap">
                <span className="station-icon">🚉</span>
                <input
                  id="from-station"
                  type="text"
                  placeholder="City or station code"
                  value={from}
                  onChange={e => { setFrom(e.target.value); setFromSelected(null); }}
                  autoComplete="off"
                />
              </div>
              {fromSuggestions.length > 0 && !fromSelected && (
                <ul className="station-dropdown">
                  {fromSuggestions.map(s => (
                    <li key={s.id} onClick={() => { setFrom(`${s.name} (${s.code})`); setFromSelected(s); setFromSuggestions([]); }}>
                      <span className="sug-code">{s.code}</span>
                      <span className="sug-name">{s.name}</span>
                      <span className="sug-city">{s.city}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* SWAP */}
            <button type="button" className="swap-btn" title="Swap stations"
              onClick={() => { const tmp = from; setFrom(to); setTo(tmp); const ts = fromSelected; setFromSelected(toSelected); setToSelected(ts); }}>
              ⇌
            </button>

            {/* TO */}
            <div className="station-input-group" ref={toRef}>
              <label>TO</label>
              <div className="station-input-wrap">
                <span className="station-icon">📍</span>
                <input
                  id="to-station"
                  type="text"
                  placeholder="City or station code"
                  value={to}
                  onChange={e => { setTo(e.target.value); setToSelected(null); }}
                  autoComplete="off"
                />
              </div>
              {toSuggestions.length > 0 && !toSelected && (
                <ul className="station-dropdown">
                  {toSuggestions.map(s => (
                    <li key={s.id} onClick={() => { setTo(`${s.name} (${s.code})`); setToSelected(s); setToSuggestions([]); }}>
                      <span className="sug-code">{s.code}</span>
                      <span className="sug-name">{s.name}</span>
                      <span className="sug-city">{s.city}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* DATE */}
            <div className="station-input-group">
              <label>DATE</label>
              <div className="station-input-wrap">
                <span className="station-icon">📅</span>
                <input
                  id="travel-date"
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>

            <button id="search-trains-btn" type="submit" className="search-btn" disabled={loading}>
              {loading ? <span className="search-spinner" /> : '🔍 Search Trains'}
            </button>
          </div>
        </form>
      </section>

      {/* ── Results ── */}
      <section className="results-section">
        {loading && (
          <div className="results-loading">
            <div className="loading-train">🚂</div>
            <p>Searching trains...</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="no-results">
            <span>😔</span>
            <p>No trains found for this route.</p>
            <small>Try different stations or check the date.</small>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="results-wrapper">
            <div className="results-header">
              <h2>{results.length} Train{results.length > 1 ? 's' : ''} Found</h2>
              <span>{fromSelected?.city} → {toSelected?.city} · {date}</span>
            </div>
            <div className="train-list">
              {results.map(train => (
                <div key={train.id} className="train-card" onClick={() => navigate(`/trains/${train.train_number}`)}>
                  {/* Train DP */}
                  <div className="train-card-img">
                    <img src={getTypeImage(train.train_type)} alt={train.train_name} />
                    <span className="train-type-badge" style={{ background: getTypeColor(train.train_type) }}>
                      {train.train_type}
                    </span>
                  </div>

                  {/* Train Info */}
                  <div className="train-card-body">
                    <div className="train-card-top">
                      <div>
                        <h3 className="train-card-name">{train.train_name}</h3>
                        <span className="train-card-number">#{train.train_number}</span>
                      </div>
                      <div className="train-timing">
                        <div className="time-block">
                          <span className="time">{train.departure_time?.slice(0,5)}</span>
                          <span className="station-code">{train.source_code}</span>
                        </div>
                        <div className="duration-block">
                          <span className="duration-line" />
                          <span className="duration-text">{train.duration}</span>
                          <span className="duration-km">{train.distance_km} km</span>
                        </div>
                        <div className="time-block">
                          <span className="time">{train.arrival_time?.slice(0,5)}</span>
                          <span className="station-code">{train.dest_code}</span>
                        </div>
                      </div>
                    </div>

                    {/* Classes & Fares */}
                    <div className="train-classes-row">
                      {train.classes?.map(cls => (
                        <div key={cls.id} className="class-pill">
                          <span className="class-code">{cls.class_code}</span>
                          <span className="class-fare">₹{cls.base_fare.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="train-card-footer">
                      <span className="train-days">🗓 {getDayLabels(train.days_of_operation)}</span>
                      <button className="book-btn" onClick={e => { e.stopPropagation(); navigate(`/trains/${train.train_number}`); }}>
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick browse cards */}
        {!searched && (
          <div className="browse-section">
            <h2>Popular Train Types</h2>
            <div className="browse-grid">
              {[
                { type: 'Rajdhani', img: '/trains/rajdhani.png', desc: 'Premium overnight express connecting Delhi to major cities', color: '#e63946' },
                { type: 'Shatabdi', img: '/trains/shatabdi.png', desc: 'Day intercity express — fast, comfortable, air-conditioned', color: '#3a86ff' },
                { type: 'Duronto', img: '/trains/duronto.png', desc: 'Non-stop long distance express with limited halts', color: '#fb5607' },
                { type: 'Vande Bharat', img: '/trains/vande_bharat.png', desc: 'India\'s fastest semi-high-speed modern train', color: '#8338ec' },
              ].map(item => (
                <div key={item.type} className="browse-card">
                  <div className="browse-card-img">
                    <img src={item.img} alt={item.type} />
                  </div>
                  <div className="browse-card-body">
                    <span className="browse-type" style={{ color: item.color }}>{item.type} Express</span>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
