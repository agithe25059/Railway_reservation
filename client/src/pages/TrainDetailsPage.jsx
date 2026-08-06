import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/auth';
import '../styles/booking.css';

const CLASS_NAMES = { '1A':'First AC', '2A':'Second AC', '3A':'Third AC', 'SL':'Sleeper', 'CC':'AC Chair Car', '2S':'Second Sitting', 'GN':'General' };

export default function TrainDetailsPage() {
  const { number } = useParams();
  const navigate = useNavigate();

  const [train, setTrain] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking Form State
  const [selectedClass, setSelectedClass] = useState(null);
  const [travelDate, setTravelDate] = useState(new Date().toISOString().split('T')[0]);

  // Mobile Verification State
  const [contactPhone, setContactPhone] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [mobileVerified, setMobileVerified] = useState(false);
  const [mobileOtpLoading, setMobileOtpLoading] = useState(false);
  const [mobileMsg, setMobileMsg] = useState('');
  const [mobileErr, setMobileErr] = useState('');

  // Aadhaar Verification State
  const [primaryAadhaar, setPrimaryAadhaar] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [aadhaarOtpLoading, setAadhaarOtpLoading] = useState(false);
  const [aadhaarMsg, setAadhaarMsg] = useState('');
  const [aadhaarErr, setAadhaarErr] = useState('');

  // Passengers
  const [passengers, setPassengers] = useState([
    { name: '', age: '', gender: 'M', aadhaar_number: '', berth_preference: 'No Preference' }
  ]);

  const [availability, setAvailability] = useState(null);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const user = JSON.parse(localStorage.getItem('rr_user') || '{}');

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const trainRes = await api.get(`/trains/${number}`);
        setTrain(trainRes.data.train);
        if (trainRes.data.train.classes?.length > 0) {
          setSelectedClass(trainRes.data.train.classes[0]);
        }

        const scheduleRes = await api.get(`/trains/${number}/schedule`);
        setSchedule(scheduleRes.data.stops);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load train details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [number]);

  useEffect(() => {
    if (!train || !selectedClass || !travelDate) return;
    const checkAvailability = async () => {
      setCheckingAvail(true);
      try {
        const res = await api.get(`/bookings/availability?train_id=${train.id}&class_code=${selectedClass.class_code}&travel_date=${travelDate}`);
        setAvailability(res.data);
      } catch {
        setAvailability(null);
      } finally {
        setCheckingAvail(false);
      }
    };
    checkAvailability();
  }, [train, selectedClass, travelDate]);

  // Send Mobile OTP
  const handleSendMobileOtp = async () => {
    if (!contactPhone || contactPhone.length !== 10) {
      return setMobileErr('Please enter a valid 10-digit mobile number.');
    }
    setMobileErr(''); setMobileMsg(''); setMobileOtpLoading(true);
    try {
      const res = await api.post('/bookings/send-mobile-otp', { phone: contactPhone });
      setMobileOtpSent(true);
      setMobileMsg(res.data.message);
    } catch (err) {
      setMobileErr(err.response?.data?.message || 'Failed to send Mobile OTP.');
    } finally { setMobileOtpLoading(false); }
  };

  // Verify Mobile OTP
  const handleVerifyMobileOtp = async () => {
    if (!mobileOtp || mobileOtp.length !== 6) {
      return setMobileErr('Please enter the 6-digit Mobile OTP.');
    }
    setMobileErr(''); setMobileMsg(''); setMobileOtpLoading(true);
    try {
      const res = await api.post('/bookings/verify-mobile-otp', { phone: contactPhone, otp: mobileOtp });
      setMobileVerified(true);
      setMobileMsg(res.data.message);
    } catch (err) {
      setMobileErr(err.response?.data?.message || 'Invalid Mobile OTP.');
    } finally { setMobileOtpLoading(false); }
  };

  // Send Aadhaar OTP
  const handleSendAadhaarOtp = async () => {
    if (!primaryAadhaar || primaryAadhaar.length !== 12) {
      return setAadhaarErr('Please enter a valid 12-digit Aadhaar number.');
    }
    setAadhaarErr(''); setAadhaarMsg(''); setAadhaarOtpLoading(true);
    try {
      const res = await api.post('/bookings/send-aadhaar-otp', { aadhaar_number: primaryAadhaar });
      setAadhaarOtpSent(true);
      setAadhaarMsg(res.data.message);
    } catch (err) {
      setAadhaarErr(err.response?.data?.message || 'Failed to send Aadhaar OTP.');
    } finally { setAadhaarOtpLoading(false); }
  };

  // Verify Aadhaar OTP
  const handleVerifyAadhaarOtp = async () => {
    if (!aadhaarOtp || aadhaarOtp.length !== 6) {
      return setAadhaarErr('Please enter the 6-digit Aadhaar OTP.');
    }
    setAadhaarErr(''); setAadhaarMsg(''); setAadhaarOtpLoading(true);
    try {
      const res = await api.post('/bookings/verify-aadhaar-otp', { aadhaar_number: primaryAadhaar, otp: aadhaarOtp });
      setAadhaarVerified(true);
      setAadhaarMsg(res.data.message);
      // Auto fill primary passenger's aadhaar
      const updated = [...passengers];
      updated[0].aadhaar_number = primaryAadhaar;
      setPassengers(updated);
    } catch (err) {
      setAadhaarErr(err.response?.data?.message || 'Invalid Aadhaar OTP.');
    } finally { setAadhaarOtpLoading(false); }
  };

  const addPassenger = () => {
    if (passengers.length >= 4) return;
    setPassengers([...passengers, { name: '', age: '', gender: 'M', aadhaar_number: '', berth_preference: 'No Preference' }]);
  };

  const removePassenger = (index) => {
    if (passengers.length <= 1) return;
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  const handleBookTickets = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!mobileVerified) {
      return setBookingError('Please verify your Contact Mobile Number via OTP first.');
    }
    if (!aadhaarVerified) {
      return setBookingError('Please verify Primary Passenger Aadhaar Number via OTP first.');
    }

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name.trim()) return setBookingError(`Passenger ${i+1}: Name is required.`);
      if (!p.age || parseInt(p.age) <= 0 || parseInt(p.age) > 120) {
        return setBookingError(`Passenger ${i+1}: Please enter a valid age.`);
      }
      if (!p.aadhaar_number || p.aadhaar_number.length !== 12) {
        return setBookingError(`Passenger ${i+1}: 12-digit Aadhaar number is required.`);
      }
    }

    setBookingLoading(true);
    try {
      const res = await api.post('/bookings/reserve', {
        train_id: train.id,
        class_code: selectedClass.class_code,
        travel_date: travelDate,
        contact_phone: contactPhone,
        passengers,
      });

      setConfirmedBooking(res.data.booking);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Booking failed. Seats may have been taken.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="booking-page-loading">
        <div className="loading-spinner-train">🚂</div>
        <p>Loading train details…</p>
      </div>
    );
  }

  if (error || !train) {
    return (
      <div className="booking-page-error">
        <h2>⚠️ Error Loading Train</h2>
        <p>{error || 'Train not found.'}</p>
        <button onClick={() => navigate('/trains')} className="back-btn-simple">← Back to Search</button>
      </div>
    );
  }

  const totalFare = Number(selectedClass?.base_fare || 0) * passengers.length;

  return (
    <div className="booking-page">
      {/* Top Navbar */}
      <header className="booking-nav">
        <div className="booking-nav-left" onClick={() => navigate('/trains')}>
          <span className="brand-icon">🚂</span>
          <span className="brand-name">RailConnect</span>
        </div>
        <div className="booking-nav-right">
          <button className="nav-bookings-btn" onClick={() => navigate('/my-bookings')}>🎟 My Bookings</button>
          <span className="user-name">👤 {user.full_name || 'User'}</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="booking-container">
        <button onClick={() => navigate('/trains')} className="back-link">← Back to Train Search</button>

        {/* Confirmed Ticket Modal/Card */}
        {confirmedBooking ? (
          <div className="ticket-success-card">
            <div className="success-header">
              <span className="success-icon">🎉</span>
              <div>
                <h2>Booking Confirmed!</h2>
                <p>📧 Booking status email sent to <b>{user.email}</b>!</p>
              </div>
            </div>

            <div className="pnr-banner">
              <span className="pnr-label">PNR NUMBER</span>
              <span className="pnr-code">{confirmedBooking.pnr}</span>
            </div>

            <div className="ticket-details-grid">
              <div>
                <span className="detail-lbl">Train</span>
                <strong>{confirmedBooking.train_name} (#{confirmedBooking.train_number})</strong>
              </div>
              <div>
                <span className="detail-lbl">Class & Date</span>
                <strong>{confirmedBooking.class_code} · {confirmedBooking.travel_date}</strong>
              </div>
              <div>
                <span className="detail-lbl">Verified Mobile</span>
                <strong>📱 {confirmedBooking.contact_phone} ✅</strong>
              </div>
              <div>
                <span className="detail-lbl">Total Fare</span>
                <strong className="fare-highlight">₹{confirmedBooking.total_fare.toLocaleString()}</strong>
              </div>
            </div>

            <div className="passenger-assigned-list">
              <h3>Verified Passengers & Assigned Seats</h3>
              <table className="assigned-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Passenger Name</th>
                    <th>Age / Gender</th>
                    <th>Aadhaar Number</th>
                    <th>Assigned Seat</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmedBooking.passengers.map((p, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td><b>{p.name}</b></td>
                      <td>{p.age} yrs / {p.gender}</td>
                      <td><span className="aadhaar-badge">XXXX-XXXX-{p.aadhaar_number?.slice(-4)} ✅</span></td>
                      <td><span className="seat-badge">{p.seat_number}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ticket-actions">
              <button className="action-btn-primary" onClick={() => navigate('/my-bookings')}>
                View My Bookings →
              </button>
            </div>
          </div>
        ) : (
          <div className="booking-grid">
            {/* Left Column: Train Info & Schedule */}
            <div className="train-info-col">
              <div className="train-header-card">
                <div className="train-header-top">
                  <span className="train-type-tag">{train.train_type}</span>
                  <span className="train-num-tag">#{train.train_number}</span>
                </div>
                <h1 className="train-title">{train.train_name}</h1>

                <div className="route-timeline">
                  <div className="route-stop">
                    <span className="stop-time">{train.departure_time?.slice(0,5)}</span>
                    <span className="stop-code">{train.source_code}</span>
                    <span className="stop-city">{train.source_city}</span>
                  </div>
                  <div className="route-arrow">
                    <span>{train.duration}</span>
                    <div className="arrow-line" />
                    <span>{train.distance_km} km</span>
                  </div>
                  <div className="route-stop">
                    <span className="stop-time">{train.arrival_time?.slice(0,5)}</span>
                    <span className="stop-code">{train.dest_code}</span>
                    <span className="stop-city">{train.dest_city}</span>
                  </div>
                </div>
              </div>

              {/* Intermediate Route Stops */}
              {schedule.length > 0 && (
                <div className="schedule-card">
                  <h3>Route Schedule ({schedule.length} Stops)</h3>
                  <div className="schedule-list">
                    {schedule.map(s => (
                      <div key={s.id} className="schedule-item">
                        <span className="stop-num">{s.stop_number}</span>
                        <div className="stop-info">
                          <strong>{s.station_name} ({s.code})</strong>
                          <span>{s.city}, {s.state}</span>
                        </div>
                        <div className="stop-times">
                          <span>Arr: {s.arrival_time ? s.arrival_time.slice(0,5) : 'Source'}</span>
                          <span>Dep: {s.departure_time ? s.departure_time.slice(0,5) : 'Dest'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Reservation & Verification Form */}
            <div className="booking-form-col">
              <form className="booking-form-card" onSubmit={handleBookTickets}>
                <h2>Reserve Seats</h2>

                {bookingError && <div className="booking-alert-error">⚠️ {bookingError}</div>}

                {/* Date Picker */}
                <div className="form-group">
                  <label htmlFor="journey-date">Date of Journey</label>
                  <input
                    id="journey-date"
                    type="date"
                    className="booking-input"
                    value={travelDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setTravelDate(e.target.value)}
                    required
                  />
                </div>

                {/* Class Selector */}
                <div className="form-group">
                  <label>Select Travel Class</label>
                  <div className="class-selector-grid">
                    {train.classes?.map(cls => (
                      <button
                        type="button"
                        key={cls.id}
                        className={`class-select-btn ${selectedClass?.class_code === cls.class_code ? 'active' : ''}`}
                        onClick={() => setSelectedClass(cls)}
                      >
                        <span className="c-code">{cls.class_code}</span>
                        <span className="c-name">{CLASS_NAMES[cls.class_code] || cls.class_name}</span>
                        <span className="c-fare">₹{Number(cls.base_fare).toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seat Availability Status */}
                <div className="avail-status-box">
                  <span>Real-time Seat Availability:</span>
                  {checkingAvail ? (
                    <span className="checking-txt">Checking…</span>
                  ) : (
                    <span className={`avail-badge ${availability?.available_seats > 0 ? 'avail-yes' : 'avail-no'}`}>
                      {availability ? availability.status : '4 Available'}
                    </span>
                  )}
                </div>

                {/* ── STEP 1: MOBILE NUMBER OTP VERIFICATION ── */}
                <div className="verification-card-step">
                  <div className="v-step-head">
                    <span className={`v-step-num ${mobileVerified ? 'done' : 'active'}`}>{mobileVerified ? '✓' : '1'}</span>
                    <span>1. Contact Mobile Verification (SMS & PNR)</span>
                  </div>

                  {mobileErr && <div className="v-error">⚠️ {mobileErr}</div>}
                  {mobileMsg && <div className="v-success">✅ {mobileMsg}</div>}

                  {!mobileVerified ? (
                    <div className="v-otp-box">
                      <div className="v-input-row">
                        <input
                          type="tel"
                          className="booking-input"
                          placeholder="10-digit Mobile Number"
                          maxLength={10}
                          value={contactPhone}
                          onChange={e => setContactPhone(e.target.value.replace(/\D/g, ''))}
                          disabled={mobileOtpSent}
                        />
                        {!mobileOtpSent ? (
                          <button type="button" className="v-btn" onClick={handleSendMobileOtp} disabled={mobileOtpLoading}>
                            {mobileOtpLoading ? 'Sending…' : 'Send Mobile OTP'}
                          </button>
                        ) : (
                          <button type="button" className="v-btn-secondary" onClick={() => setMobileOtpSent(false)}>Change</button>
                        )}
                      </div>

                      {mobileOtpSent && (
                        <div className="v-input-row margin-top-sm">
                          <input
                            type="text"
                            className="booking-input"
                            placeholder="Enter 6-digit Mobile OTP"
                            maxLength={6}
                            value={mobileOtp}
                            onChange={e => setMobileOtp(e.target.value.replace(/\D/g, ''))}
                          />
                          <button type="button" className="v-btn-success" onClick={handleVerifyMobileOtp} disabled={mobileOtpLoading}>
                            {mobileOtpLoading ? 'Verifying…' : 'Verify Mobile OTP'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="verified-badge-row">
                      <span>📱 Mobile <b>{contactPhone}</b> Verified via OTP</span>
                      <span className="badge-check">VERIFIED ✅</span>
                    </div>
                  )}
                </div>

                {/* ── STEP 2: AADHAAR OTP VERIFICATION ── */}
                <div className="verification-card-step">
                  <div className="v-step-head">
                    <span className={`v-step-num ${aadhaarVerified ? 'done' : 'active'}`}>{aadhaarVerified ? '✓' : '2'}</span>
                    <span>2. Primary Passenger Aadhaar Verification</span>
                  </div>

                  {aadhaarErr && <div className="v-error">⚠️ {aadhaarErr}</div>}
                  {aadhaarMsg && <div className="v-success">✅ {aadhaarMsg}</div>}

                  {!aadhaarVerified ? (
                    <div className="v-otp-box">
                      <div className="v-input-row">
                        <input
                          type="text"
                          className="booking-input"
                          placeholder="12-digit Aadhaar Number"
                          maxLength={12}
                          value={primaryAadhaar}
                          onChange={e => setPrimaryAadhaar(e.target.value.replace(/\D/g, ''))}
                          disabled={aadhaarOtpSent}
                        />
                        {!aadhaarOtpSent ? (
                          <button type="button" className="v-btn" onClick={handleSendAadhaarOtp} disabled={aadhaarOtpLoading}>
                            {aadhaarOtpLoading ? 'Sending…' : 'Send Aadhaar OTP'}
                          </button>
                        ) : (
                          <button type="button" className="v-btn-secondary" onClick={() => setAadhaarOtpSent(false)}>Change</button>
                        )}
                      </div>

                      {aadhaarOtpSent && (
                        <div className="v-input-row margin-top-sm">
                          <input
                            type="text"
                            className="booking-input"
                            placeholder="Enter 6-digit Aadhaar OTP"
                            maxLength={6}
                            value={aadhaarOtp}
                            onChange={e => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                          />
                          <button type="button" className="v-btn-success" onClick={handleVerifyAadhaarOtp} disabled={aadhaarOtpLoading}>
                            {aadhaarOtpLoading ? 'Verifying…' : 'Verify Aadhaar OTP'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="verified-badge-row">
                      <span>🆔 Aadhaar <b>XXXX-XXXX-{primaryAadhaar.slice(-4)}</b> Verified via OTP</span>
                      <span className="badge-check">VERIFIED ✅</span>
                    </div>
                  )}
                </div>

                {/* Passenger Inputs */}
                <div className="passengers-section">
                  <div className="passengers-header">
                    <h3>Passenger Details ({passengers.length}/4)</h3>
                    {passengers.length < 4 && (
                      <button type="button" className="add-passenger-btn" onClick={addPassenger}>
                        + Add Passenger
                      </button>
                    )}
                  </div>

                  {passengers.map((p, idx) => (
                    <div key={idx} className="passenger-card-input">
                      <div className="p-card-top">
                        <span>Passenger #{idx + 1} {idx === 0 ? '(Primary - Aadhaar Verified)' : ''}</span>
                        {passengers.length > 1 && idx > 0 && (
                          <button type="button" className="remove-p-btn" onClick={() => removePassenger(idx)}>✕ Remove</button>
                        )}
                      </div>

                      <div className="p-inputs-grid-aadhaar">
                        <input
                          type="text"
                          placeholder="Full Name"
                          className="booking-input"
                          value={p.name}
                          onChange={e => handlePassengerChange(idx, 'name', e.target.value)}
                          required
                        />

                        <input
                          type="number"
                          placeholder="Age"
                          min={1} max={120}
                          className="booking-input"
                          value={p.age}
                          onChange={e => handlePassengerChange(idx, 'age', e.target.value)}
                          required
                        />

                        <select
                          className="booking-input"
                          value={p.gender}
                          onChange={e => handlePassengerChange(idx, 'gender', e.target.value)}
                        >
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                          <option value="O">Other</option>
                        </select>

                        <input
                          type="text"
                          placeholder="12-digit Aadhaar Number"
                          maxLength={12}
                          className="booking-input"
                          value={p.aadhaar_number}
                          onChange={e => handlePassengerChange(idx, 'aadhaar_number', e.target.value.replace(/\D/g, ''))}
                          required
                        />

                        <select
                          className="booking-input grid-full-width"
                          value={p.berth_preference}
                          onChange={e => handlePassengerChange(idx, 'berth_preference', e.target.value)}
                        >
                          <option value="No Preference">No Berth Preference</option>
                          <option value="Lower">Lower Berth</option>
                          <option value="Middle">Middle Berth</option>
                          <option value="Upper">Upper Berth</option>
                          <option value="Side Lower">Side Lower</option>
                          <option value="Side Upper">Side Upper</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Fare Summary */}
                <div className="fare-summary-box">
                  <div className="fare-row">
                    <span>Base Fare ({selectedClass?.class_code} x {passengers.length})</span>
                    <span>₹{totalFare.toLocaleString()}</span>
                  </div>
                  <div className="fare-row fare-total">
                    <span>Total Amount Payable</span>
                    <span>₹{totalFare.toLocaleString()}</span>
                  </div>
                </div>

                {/* Submit Booking Button */}
                <button
                  id="confirm-booking-btn"
                  type="submit"
                  className="confirm-booking-btn"
                  disabled={bookingLoading || availability?.available_seats === 0 || !mobileVerified || !aadhaarVerified}
                >
                  {bookingLoading ? (
                    <span className="btn-spinner" />
                  ) : !mobileVerified || !aadhaarVerified ? (
                    '🔒 Verify Mobile & Aadhaar OTP First'
                  ) : availability?.available_seats === 0 ? (
                    '🚫 Fully Booked (0 Seats Available)'
                  ) : (
                    `🎟 Confirm & Book Ticket (₹${totalFare.toLocaleString()})`
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
