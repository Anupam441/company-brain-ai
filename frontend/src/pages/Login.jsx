import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getDeptTheme } from '../utils/departmentTheme';

function Login() {
  const { department } = useParams();
  const theme = getDeptTheme(department);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [otpStage, setOtpStage] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });

      if (res.data.requiresOtp) {
        setOtpStage(true);
        setDemoOtp(res.data.demoOtp);
      } else {
        login(res.data.user, res.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${theme.glow}`,
          borderRadius: '20px',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: `0 8px 40px ${theme.glow}`
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '20px', background: theme.glow, marginBottom: '16px', fontSize: '13px' }}>
          {theme.icon} {theme.label} Portal
        </div>

        {!otpStage ? (
          <motion.form onSubmit={handleSubmit} key="password-form">
            <h2 style={{ fontSize: '28px', marginBottom: '8px', background: `linear-gradient(135deg, ${theme.color}, #3b82f6)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Welcome Back</h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px', fontSize: '14px' }}>Login to access your workspace</p>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', marginBottom: '16px' }}>{error}</div>
            )}

            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />

            <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '14px' }}>
              <Link to="/forgot-password" style={{ fontSize: '12.5px', color: '#9ca3af', textDecoration: 'none' }}>Forgot password?</Link>
            </div>

            <motion.button whileHover={{ scale: 1.02, boxShadow: `0 0 25px ${theme.glow}` }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg, ${theme.color}, #3b82f6)`, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' }}>
              {loading ? 'Logging in...' : 'Login'}
            </motion.button>

            <p style={{ marginTop: '20px', fontSize: '14px', color: '#9ca3af', textAlign: 'center' }}>
              Don't have an account? <Link to="/signup" style={{ color: theme.color }}>Sign up</Link>
            </p>
          </motion.form>
        ) : (
          <motion.form onSubmit={handleVerifyOtp} initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="otp-form">
            <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>🔐 Verify it's you</h2>
            <p style={{ color: '#9ca3af', marginBottom: '10px', fontSize: '13.5px' }}>Enter the 6-digit code sent to {email}</p>

            {demoOtp && (
              <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fcd34d', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', marginBottom: '16px' }}>
                🧪 Demo mode (no email service configured) — your code is: <strong>{demoOtp}</strong>
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', marginBottom: '16px' }}>{error}</div>
            )}

            <input type="text" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required
              style={{ ...inputStyle, textAlign: 'center', fontSize: '20px', letterSpacing: '8px' }} />

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg, ${theme.color}, #3b82f6)`, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' }}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </motion.button>

            <button type="button" onClick={() => { setOtpStage(false); setOtp(''); setError(''); }}
              style={{ width: '100%', padding: '10px', background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', marginTop: '10px' }}>
              ← Back to login
            </button>
          </motion.form>
        )}
      </motion.div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 16px', marginBottom: '14px', background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box'
};

export default Login;
