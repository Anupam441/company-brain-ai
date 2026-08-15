import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import { getPasswordStrength } from '../utils/passwordStrength';

function ForgotPassword() {
  const [stage, setStage] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const strength = getPasswordStrength(newPassword);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setDemoOtp(res.data.demoOtp);
      setStage('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed');
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      setStage('done');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '20px',
          padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        {stage === 'email' && (
          <form onSubmit={handleRequestReset}>
            <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>🔑 Reset Password</h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px', fontSize: '14px' }}>Enter your account email to receive a reset code.</p>

            {error && <div style={errorBox}>{error}</div>}

            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} style={buttonStyle}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </motion.button>

            <p style={{ marginTop: '20px', fontSize: '14px', color: '#9ca3af', textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#a855f7' }}>← Back to login</Link>
            </p>
          </form>
        )}

        {stage === 'reset' && (
          <form onSubmit={handleResetPassword}>
            <h2 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>Enter Reset Code</h2>
            <p style={{ color: '#9ca3af', marginBottom: '10px', fontSize: '13.5px' }}>We sent a 6-digit code to {email}</p>

            {demoOtp && (
              <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fcd34d', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', marginBottom: '16px' }}>
                🧪 Demo mode — your code is: <strong>{demoOtp}</strong>
              </div>
            )}

            {error && <div style={errorBox}>{error}</div>}

            <input type="text" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required
              style={{ ...inputStyle, textAlign: 'center', fontSize: '18px', letterSpacing: '6px' }} />

            <input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
              style={{ ...inputStyle, marginBottom: newPassword ? '6px' : '14px' }} />

            {newPassword && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ flex: 1, height: '4px', borderRadius: '3px', background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: strength.color }}>{strength.label}</div>
              </div>
            )}

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} style={buttonStyle}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </motion.button>
          </form>
        )}

        {stage === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '14px' }}>✅</div>
            <h2 style={{ fontSize: '22px', marginBottom: '10px', color: '#fff' }}>Password reset!</h2>
            <p style={{ color: '#9ca3af', marginBottom: '24px', fontSize: '14px' }}>You can now log in with your new password.</p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/login')} style={buttonStyle}>
              Go to Login
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px 16px', marginBottom: '14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' };
const errorBox = { background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', marginBottom: '16px' };

export default ForgotPassword;
