import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/auth';
import '../styles/trains.css';

const DAY_MAP = { '1':'M','2':'T','3':'W','4':'Th','5':'F','6':'Sa','7':'Su' };
const ALL_DAYS = ['1','2','3','4','5','6','7'];

const TYPE_COLOR = {
  'Rajdhani':'#e63946','Shatabdi':'#3a86ff','Duronto':'#fb5607',
  'Vande Bharat':'#8338ec','Superfast':'#06d6a0','Express':'#f4a261',
  'Mail':'#f4a261','Passenger':'#adb5bd','Local':'#adb5bd'
};

const CLASS_LABELS = { '1A':'1st AC','2A':'2nd AC','3A':'3rd AC','SL':'Sleeper','CC':'Chair Car','2S':'2nd Sitting','GN':'General' };

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
  const [sortBy, setSortBy] = useState('departure');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  const user = JSON.parse(localStorage.getItem('rr_user') || '{}');

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
    if (!fromSelected || !toSelected) return setError('Please select stations from the dropdown.');
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

  const swapStations = () => {
    const tmpFrom = from, tmpFromSel = fromSelected;
    setFrom(to); setFromSelected(toSelected);
    setTo(tmpFrom); setToSelected(tmpFromSel);
  };

  // Filtered + sorted results
  const filteredResults = results
    .filter(t => {
      if (filterClass !== 'ALL' && !t.classes?.some(c => c.class_code === filterClass)) return false;
      if (filterType !== 'ALL' && t.train_type !== filterType) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'departure') return a.departure_time?.localeCompare(b.departure_time);
      if (sortBy === 'arrival') return a.arrival_time?.localeCompare(b.arrival_time);
      if (sortBy === 'duration') return a.duration?.localeCompare(b.duration);
      return 0;
    });

  const availableClasses = [...new Set(results.flatMap(t => t.classes?.map(c => c.class_code) || []))];
  const availableTypes = [...new Set(results.map(t => t.train_type))];

  return (
    <div className="irctc-page">
      {/* ── Top Nav ── */}
      <header className="irctc-nav">
        <div className="irctc-nav-left">
          <span className="irctc-logo">🚂</span>
          <span className="irctc-brand">RailConnect</span>
        </div>
        <nav className="irctc-nav-links">
          <span className="nav-link active">Train Search</span>
          <span className="nav-link">My Bookings</span>
          <span className="nav-link">PNR Status</span>
        </nav>
        <div className="irctc-nav-right">
          <span className="user-chip">👤 {user.full_name || 'User'}</span>
          <button className="nav-logout" onClick={() => { localStorage.clear(); navigate('/login'); }}>Logout</button>
        </div>
      </header>

      {/* ── Search Bar ── */}
      <div className="irctc-search-bar">
        <form className="irctc-search-form" onSubmit={handleSearch} id="irctc-search-form">
          <div className="irctc-search-fields">
            {/* FROM */}
            <div className="irctc-field-wrap">
              <div className="irctc-field-label">FROM</div>
              <div className="irctc-field-inner">
                <input id="from-station" type="text" className="irctc-input" placeholder="Station name or code"
                  value={from} autoComplete="off"
                  onChange={e => { setFrom(e.target.value); setFromSelected(null); }} />
                {fromSuggestions.length > 0 && !fromSelected && (
                  <ul className="irctc-dropdown">
                    {fromSuggestions.map(s => (
                      <li key={s.id} onClick={() => { setFrom(`${s.name} (${s.code})`); setFromSelected(s); setFromSuggestions([]); }}>
                        <b>{s.code}</b> — {s.name}, {s.city}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <button type="button" className="irctc-swap" onClick={swapStations} title="Swap">⇄</button>

            {/* TO */}
            <div className="irctc-field-wrap">
              <div className="irctc-field-label">TO</div>
              <div className="irctc-field-inner">
                <input id="to-station" type="text" className="irctc-input" placeholder="Station name or code"
                  value={to} autoComplete="off"
                  onChange={e => { setTo(e.target.value); setToSelected(null); }} />
                {toSuggestions.length > 0 && !toSelected && (
                  <ul className="irctc-dropdown">
                    {toSuggestions.map(s => (
                      <li key={s.id} onClick={() => { setTo(`${s.name} (${s.code})`); setToSelected(s); setToSuggestions([]); }}>
                        <b>{s.code}</b> — {s.name}, {s.city}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* DATE */}
            <div className="irctc-field-wrap irctc-date-wrap">
              <div className="irctc-field-label">DATE OF JOURNEY</div>
              <input id="travel-date" type="date" className="irctc-input irctc-date-input"
                value={date} min={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(e.target.value)} />
            </div>

            <button id="search-trains-btn" type="submit" className="irctc-search-btn" disabled={loading}>
              {loading ? <span className="irctc-spinner" /> : '🔍 Search Trains'}
            </button>
          </div>
          {error && <div className="irctc-error">⚠️ {error}</div>}
        </form>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="irctc-loading">
          <div className="irctc-loading-train">🚂</div>
          <p>Fetching available trains…</p>
        </div>
      )}

      {/* ── Results Layout ── */}
      {!loading && searched && (
        <div className="irctc-results-layout">

          {/* ── Filters Sidebar ── */}
          <aside className="irctc-filters">
            <div className="filter-header">🔧 Filter Results</div>

            {availableClasses.length > 0 && (
              <div className="filter-section">
                <div className="filter-title">Travel Class</div>
                <label className={`filter-opt ${filterClass === 'ALL' ? 'active' : ''}`}>
                  <input type="radio" name="class" value="ALL" checked={filterClass === 'ALL'}
                    onChange={() => setFilterClass('ALL')} /> All Classes
                </label>
                {availableClasses.map(c => (
                  <label key={c} className={`filter-opt ${filterClass === c ? 'active' : ''}`}>
                    <input type="radio" name="class" value={c} checked={filterClass === c}
                      onChange={() => setFilterClass(c)} />
                    {c} — {CLASS_LABELS[c]}
                  </label>
                ))}
              </div>
            )}

            {availableTypes.length > 0 && (
              <div className="filter-section">
                <div className="filter-title">Train Type</div>
                <label className={`filter-opt ${filterType === 'ALL' ? 'active' : ''}`}>
                  <input type="radio" name="type" value="ALL" checked={filterType === 'ALL'}
                    onChange={() => setFilterType('ALL')} /> All Types
                </label>
                {availableTypes.map(t => (
                  <label key={t} className={`filter-opt ${filterType === t ? 'active' : ''}`}>
                    <input type="radio" name="type" value={t} checked={filterType === t}
                      onChange={() => setFilterType(t)} />
                    <span style={{ color: TYPE_COLOR[t] }}>●</span> {t}
                  </label>
                ))}
              </div>
            )}
          </aside>

          {/* ── Train List ── */}
          <main className="irctc-main">
            {/* Route + Count + Sort */}
            <div className="irctc-results-topbar">
              <div className="irctc-route-info">
                <span className="irctc-route-text">
                  {fromSelected?.name} ({fromSelected?.code}) → {toSelected?.name} ({toSelected?.code})
                </span>
                <span className="irctc-date-badge">📅 {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' })}</span>
              </div>
              <div className="irctc-sort-wrap">
                <span className="irctc-count">{filteredResults.length} Train{filteredResults.length !== 1 ? 's' : ''} Found</span>
                <select className="irctc-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="departure">Sort: Departure ↑</option>
                  <option value="arrival">Sort: Arrival ↑</option>
                  <option value="duration">Sort: Duration ↑</option>
                </select>
              </div>
            </div>

            {/* Column Headers */}
            {filteredResults.length > 0 && (
              <div className="irctc-col-headers">
                <div className="col-train">Train</div>
                <div className="col-time">Departs</div>
                <div className="col-dur">Duration</div>
                <div className="col-time">Arrives</div>
                <div className="col-days">Runs On</div>
                <div className="col-classes">Availability</div>
              </div>
            )}

            {/* No results */}
            {filteredResults.length === 0 && (
              <div className="irctc-no-results">
                <div className="irctc-no-icon">🚫</div>
                <h3>No Trains Found</h3>
                <p>No trains available for this route{filterClass !== 'ALL' || filterType !== 'ALL' ? ' with selected filters' : ''}.</p>
                {(filterClass !== 'ALL' || filterType !== 'ALL') && (
                  <button onClick={() => { setFilterClass('ALL'); setFilterType('ALL'); }} className="irctc-clear-filter">
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* Train Rows */}
            {filteredResults.map(train => (
              <div key={train.id} className="irctc-train-row">
                {/* Train Name + Number */}
                <div className="col-train">
                  <div className="train-row-name">{train.train_name}</div>
                  <div className="train-row-meta">
                    <span className="train-row-num">#{train.train_number}</span>
                    <span className="train-row-type" style={{ background: TYPE_COLOR[train.train_type] + '22', color: TYPE_COLOR[train.train_type] }}>
                      {train.train_type}
                    </span>
                  </div>
                </div>

                {/* Departs */}
                <div className="col-time">
                  <div className="time-big">{train.departure_time?.slice(0,5)}</div>
                  <div className="time-station">{train.source_code}</div>
                </div>

                {/* Duration */}
                <div className="col-dur">
                  <div className="dur-arrow">──────→</div>
                  <div className="dur-text">{train.duration}</div>
                  <div className="dur-km">{train.distance_km} km</div>
                </div>

                {/* Arrives */}
                <div className="col-time">
                  <div className="time-big">{train.arrival_time?.slice(0,5)}</div>
                  <div className="time-station">{train.dest_code}</div>
                </div>

                {/* Days */}
                <div className="col-days">
                  <div className="day-dots">
                    {ALL_DAYS.map(d => (
                      <span key={d} className={`day-dot ${train.days_of_operation?.includes(d) ? 'day-on' : 'day-off'}`}>
                        {DAY_MAP[d]}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Classes + Book */}
                <div className="col-classes">
                  <div className="class-grid">
                    {train.classes?.map(cls => (
                      <div key={cls.id} className="class-avail-box">
                        <div className="class-avail-code">{cls.class_code}</div>
                        <div className="class-avail-status avail">Available</div>
                        <div className="class-avail-fare">₹{Number(cls.base_fare).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <button className="irctc-book-btn" onClick={() => navigate(`/trains/${train.train_number}`)}>
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </main>
        </div>
      )}

      {/* ── Initial Browse (before search) ── */}
      {!searched && !loading && (
        <div className="irctc-welcome">
          <div className="irctc-welcome-inner">
            <h2>🚂 Search Trains Across India</h2>
            <p>Enter your origin and destination above to find available trains, check seat availability and book tickets.</p>
            <div className="irctc-quick-routes">
              <div className="quick-route-title">Popular Routes</div>
              <div className="quick-routes-grid">
                {[
                  { fromCode:'NDLS', fromName:'New Delhi', toCode:'MAS', toName:'Chennai Central', label:'New Delhi → Chennai' },
                  { fromCode:'NDLS', fromName:'New Delhi', toCode:'HWH', toName:'Howrah (Kolkata)', label:'New Delhi → Kolkata' },
                  { fromCode:'NDLS', fromName:'New Delhi', toCode:'BCT', toName:'Mumbai Central', label:'New Delhi → Mumbai' },
                  { fromCode:'NDLS', fromName:'New Delhi', toCode:'SBC', toName:'KSR Bengaluru', label:'New Delhi → Bengaluru' },
                  { fromCode:'NDLS', fromName:'New Delhi', toCode:'BSB', toName:'Varanasi', label:'New Delhi → Varanasi' },
                  { fromCode:'BCT', fromName:'Mumbai Central', toCode:'ADI', toName:'Ahmedabad', label:'Mumbai → Ahmedabad' },
                  { fromCode:'MAS', fromName:'Chennai Central', toCode:'MYS', toName:'Mysuru', label:'Chennai → Mysuru' },
                  { fromCode:'NDLS', fromName:'New Delhi', toCode:'SC', toName:'Secunderabad', label:'New Delhi → Hyderabad' },
                ].map(r => (
                  <button key={r.label} className="quick-route-btn"
                    onClick={async () => {
                      const fromObj = { code: r.fromCode, name: r.fromName };
                      const toObj = { code: r.toCode, name: r.toName };
                      setFrom(`${r.fromName} (${r.fromCode})`);
                      setTo(`${r.toName} (${r.toCode})`);
                      setFromSelected(fromObj);
                      setToSelected(toObj);
                      setError(''); setLoading(true); setSearched(true);
                      try {
                        const res = await api.get(`/trains/search?from=${r.fromCode}&to=${r.toCode}&date=${date}`);
                        setResults(res.data.trains);
                      } catch (err) {
                        setError(err.response?.data?.message || 'Search failed. Try again.');
                        setResults([]);
                      } finally { setLoading(false); }
                    }}>
                    🚆 {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
