import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';
import api from '../api/auth';
import '../styles/auth.css';

const STEPS = { FORM: 'form', OTP: 'otp' };

export default function RegisterPage() {
  const navigate = useNavigate();

  // Step control
  const [step, setStep] = useState(STEPS.FORM);

  // Form fields
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [otp, setOtp] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // OTP resend timer
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval;
    if (step === STEPS.OTP && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((t) => {
          if (t <= 1) { setCanResend(true); clearInterval(interval); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!form.full_name.trim()) return 'Full name is required.';
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) return 'Please enter a valid email.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (form.password !== form.confirm_password) return 'Passwords do not match.';
    return null;
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/send-otp', { email: form.email, full_name: form.full_name });
      setStep(STEPS.OTP);
      setResendTimer(60);
      setCanResend(false);
      setSuccess(`OTP sent to ${form.email}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Register
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) return setError('Please enter the 6-digit OTP.');

    setLoading(true);
    setError('');
    try {
      const res = await registerUser({ ...form, otp });
      localStorage.setItem('rr_token', res.data.token);
      localStorage.setItem('rr_user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/send-otp', { email: form.email, full_name: form.full_name });
      setResendTimer(60);
      setCanResend(false);
      setSuccess('New OTP sent! Check your inbox.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const getStrength = () => {
    const p = form.password;
    if (!p) return { level: 0, label: '' };
    if (p.length < 6) return { level: 1, label: 'Weak' };
    if (p.length < 10 || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { level: 2, label: 'Fair' };
    return { level: 3, label: 'Strong' };
  };
  const strength = getStrength();

  return (
    <div className="auth-bg">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="auth-card auth-card--register">
        {/* Header */}
        <div className="auth-header">
          <div className="train-icon">🚂</div>
          <h1 className="auth-title">RailConnect</h1>
          <p className="auth-subtitle">
            {step === STEPS.FORM ? 'Create your account to get started' : 'Verify your email address'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="step-indicator">
          <div className={`step-dot ${step === STEPS.FORM ? 'active' : 'done'}`}>
            {step === STEPS.OTP ? '✓' : '1'}
          </div>
          <div className={`step-line ${step === STEPS.OTP ? 'done' : ''}`} />
          <div className={`step-dot ${step === STEPS.OTP ? 'active' : ''}`}>2</div>
        </div>
        <div className="step-labels">
          <span className={step === STEPS.FORM ? 'step-label-active' : 'step-label-done'}>Details</span>
          <span className={step === STEPS.OTP ? 'step-label-active' : 'step-label-inactive'}>Verify Email</span>
        </div>

        {/* ── STEP 1: Registration Form ── */}
        {step === STEPS.FORM && (
          <form className="auth-form" onSubmit={handleSendOTP} id="register-form">
            {error && <div className="error-banner" role="alert"><span>⚠️</span> {error}</div>}

            <div className="input-group">
              <label htmlFor="reg-fullname">Full Name</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  id="reg-fullname"
                  type="text"
                  name="full_name"
                  placeholder="John Doe"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="reg-email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="reg-password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {form.password && (
                <div className="strength-bar">
                  <div className={`strength-fill strength-${strength.level}`} />
                  <span className={`strength-label strength-label-${strength.level}`}>{strength.label}</span>
                </div>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔐</span>
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirm_password"
                  placeholder="Re-enter your password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  required
                />
                <button type="button" className="toggle-pass" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button id="send-otp-btn" type="submit" className={`auth-btn ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? <span className="spinner" /> : '📧 Send OTP to Email'}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP Verification ── */}
        {step === STEPS.OTP && (
          <form className="auth-form" onSubmit={handleVerifyAndRegister} id="otp-form">
            {error && <div className="error-banner" role="alert"><span>⚠️</span> {error}</div>}
            {success && <div className="success-banner" role="status"><span>✅</span> {success}</div>}

            <div className="otp-info">
              <p>We sent a <strong>6-digit code</strong> to</p>
              <p className="otp-email">{form.email}</p>
            </div>

            <div className="input-group">
              <label htmlFor="otp-input">Enter OTP</label>
              <div className="input-wrapper">
                <span className="input-icon">🔢</span>
                <input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                  className="otp-input-field"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button id="verify-otp-btn" type="submit" className={`auth-btn ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? <span className="spinner" /> : '✅ Verify & Create Account'}
            </button>

            <div className="otp-resend">
              {canResend ? (
                <button type="button" className="resend-btn" onClick={handleResend} disabled={loading}>
                  🔄 Resend OTP
                </button>
              ) : (
                <p className="resend-timer">Resend OTP in <span>{resendTimer}s</span></p>
              )}
            </div>

            <button
              type="button"
              className="back-btn"
              onClick={() => { setStep(STEPS.FORM); setError(''); setSuccess(''); setOtp(''); }}
            >
              ← Change email or details
            </button>
          </form>
        )}

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
