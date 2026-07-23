import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Link2, Mail, Lock, Eye, EyeOff, ArrowLeft, Zap, UserCheck, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const GUEST_EMAIL = 'guest-demo@shortly.app';
const GUEST_PASS  = 'GuestDemo#2026';

// ─── Modes ──────────────────────────────────────────────────────────────────────
// 'home'    : main login page (Google / Email / OTP tabs)
// 'signup'  : email + password signup
// 'otp'     : enter email → get OTP
// 'otpVerify': enter OTP code

export default function Login() {
  const { user, signInWithGoogle, signUpWithEmail, signInWithEmail, signInWithOtp, verifyOtp, signInAsGuest } = useAuth();
  const [mode, setMode]           = useState('home');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPass, setConfirm] = useState('');
  const [otp, setOtp]             = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [busy, setBusy]           = useState(false);
  const [showCreds, setShowCreds] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleGoogle = async () => {
    try { await signInWithGoogle(); }
    catch (e) { toast.error(e.message || 'Google login failed'); }
  };

  const handleGuest = async () => {
    setBusy(true);
    try { await signInAsGuest(); }
    catch (e) { toast.error('Guest login failed: ' + (e.message || '')); }
    finally { setBusy(false); }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signInWithEmail(email, password);
      toast.success('Logged in!');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally { setBusy(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPass) { toast.error('Passwords do not match'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setBusy(true);
    try {
      await signUpWithEmail(email, password);
      toast.success('Account created! Check your email to confirm your address.');
      setMode('emailLogin');
    } catch (err) {
      toast.error(err.message || 'Signup failed');
    } finally { setBusy(false); }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signInWithOtp(email);
      toast.success(`OTP sent to ${email}`);
      setMode('otpVerify');
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
    } finally { setBusy(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await verifyOtp(email, otp);
      toast.success('Logged in!');
    } catch (err) {
      toast.error(err.message || 'Invalid OTP');
    } finally { setBusy(false); }
  };

  // ─── Shared back button ────────────────────────────────────────────────────
  const Back = () => (
    <button className="otp-back-btn" onClick={() => setMode('home')} type="button">
      <ArrowLeft size={14} /> Back
    </button>
  );

  return (
    <div className="login-container">
      <div className="login-card">

        {/* ── LOGO ── */}
        <div className="login-header">
          <div className="logo-icon"><Link2 size={28} /></div>
          <h1>Shortly</h1>
          <p>
            {mode === 'home'      && 'Sign in to manage your short links'}
            {mode === 'emailLogin'&& 'Sign in with your email'}
            {mode === 'signup'    && 'Create your account'}
            {mode === 'otp'       && 'Sign in with OTP'}
            {mode === 'otpVerify' && 'Enter the OTP sent to your email'}
          </p>
        </div>

        {/* ═════════════════════ HOME ═════════════════════ */}
        {mode === 'home' && (
          <>
            <div className="login-actions">
              {/* Google */}
              <button className="google-btn" onClick={handleGoogle}>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="google-icon" />
                Continue with Google
              </button>

              <div className="login-divider"><span>or</span></div>

              {/* Email + Password */}
              <button className="auth-btn auth-btn--email" onClick={() => setMode('emailLogin')}>
                <Mail size={16} /> Sign in with Email & Password
              </button>

              {/* OTP */}
              <button className="auth-btn auth-btn--otp" onClick={() => setMode('otp')}>
                <Zap size={16} /> Sign in with OTP (no password)
              </button>

              <p className="switch-link">
                Don't have an account?{' '}
                <button type="button" onClick={() => setMode('signup')}>Sign up</button>
              </p>
            </div>

            {/* Guest login — reveal credentials panel */}
            <div className="guest-section">
              <div className="guest-divider"><span>For recruiters / demo</span></div>

              {/* One-click auto-login */}
              <button className="auth-btn auth-btn--guest" onClick={handleGuest} disabled={busy}>
                <UserCheck size={16} />
                {busy ? 'Logging in…' : '⚡ One-Click Guest Access'}
              </button>

              {/* Toggle to reveal credentials */}
              <button
                type="button"
                className="creds-toggle"
                onClick={() => setShowCreds(v => !v)}
              >
                {showCreds ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {showCreds ? 'Hide' : 'View'} guest credentials
              </button>

              {showCreds && (
                <div className="creds-box">
                  <div className="cred-row">
                    <span className="cred-label">Email</span>
                    <code className="cred-val">{GUEST_EMAIL}</code>
                    <button type="button" className="cred-copy" title="Copy" onClick={() => { navigator.clipboard.writeText(GUEST_EMAIL); toast.success('Email copied!'); }}>
                      <Copy size={12} />
                    </button>
                  </div>
                  <div className="cred-row">
                    <span className="cred-label">Password</span>
                    <code className="cred-val">{GUEST_PASS}</code>
                    <button type="button" className="cred-copy" title="Copy" onClick={() => { navigator.clipboard.writeText(GUEST_PASS); toast.success('Password copied!'); }}>
                      <Copy size={12} />
                    </button>
                  </div>
                  <p className="creds-hint">Use these credentials on the Email &amp; Password login option, or just click ⚡ above.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═════════════════════ EMAIL LOGIN ══════════════ */}
        {mode === 'emailLogin' && (
          <form className="auth-form" onSubmit={handleEmailLogin}>
            <Back />
            <div className="input-group">
              <label className="input-label">Email address</label>
              <input id="login-email" className="input-field" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="pass-wrap">
                <input id="login-password" className="input-field" type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button className="btn-primary full-width" type="submit" disabled={busy}>
              {busy ? <span className="loading-spinner" /> : <Lock size={15} />}
              {busy ? 'Signing in...' : 'Sign In'}
            </button>
            <p className="switch-link center">
              No account?{' '}
              <button type="button" onClick={() => setMode('signup')}>Create one</button>
            </p>
          </form>
        )}

        {/* ═════════════════════ SIGN UP ══════════════════ */}
        {mode === 'signup' && (
          <form className="auth-form" onSubmit={handleSignup}>
            <Back />
            <div className="input-group">
              <label className="input-label">Email address</label>
              <input id="signup-email" className="input-field" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="pass-wrap">
                <input id="signup-password" className="input-field" type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="min 8 characters" required />
                <button type="button" className="pass-toggle" onClick={() => setShowPass(v => !v)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Confirm Password</label>
              <input id="signup-confirm" className="input-field" type="password" value={confirmPass}
                onChange={e => setConfirm(e.target.value)} placeholder="repeat password" required />
            </div>
            <button className="btn-primary full-width" type="submit" disabled={busy}>
              {busy ? <span className="loading-spinner" /> : null}
              {busy ? 'Creating account...' : 'Create Account'}
            </button>
            <p className="switch-link center">
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('emailLogin')}>Sign in</button>
            </p>
          </form>
        )}

        {/* ═════════════════════ OTP SEND ═════════════════ */}
        {mode === 'otp' && (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <Back />
            <div className="input-group">
              <label className="input-label">Email address</label>
              <input id="otp-email" className="input-field" type="email" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <button className="btn-primary full-width" type="submit" disabled={busy}>
              {busy ? <span className="loading-spinner" /> : <Zap size={15} />}
              {busy ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {/* ═════════════════════ OTP VERIFY ═══════════════ */}
        {mode === 'otpVerify' && (
          <form className="auth-form" onSubmit={handleVerifyOtp}>
            <Back />
            <p className="otp-hint">Enter the 6-digit code sent to <strong>{email}</strong></p>
            <input id="otp-code" className="input-field otp-input" type="text" inputMode="numeric"
              maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456" required />
            <button className="btn-primary full-width" type="submit" disabled={busy}>
              {busy ? <span className="loading-spinner" /> : null}
              {busy ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <p className="switch-link center">
              Wrong email?{' '}
              <button type="button" onClick={() => setMode('otp')}>Re-send</button>
            </p>
          </form>
        )}

        <div className="login-footer">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
}
