import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getPasswordStrength } from '../utils/passwordStrength';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { name, email, password });
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
          style={{ fontSize: '28px', marginBottom: '8px', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >Create Account</motion.h2>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.5 }}
          style={{ color: '#9ca3af', marginBottom: '24px', fontSize: '14px' }}
        >Start building your company's knowledge base</motion.p>

        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', marginBottom: '16px' }}
          >{error}</motion.div>
        )}

        <motion.input initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28, duration: 0.4 }}
          type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
        <motion.input initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.34, duration: 0.4 }}
          type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        <motion.input initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.4 }}
          type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ ...inputStyle, marginBottom: password ? '6px' : '14px' }} />

        {password && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                  flex: 1, height: '4px', borderRadius: '3px',
                  background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.2s'
                }} />
              ))}
            </div>
            <div style={{ fontSize: '11px', color: strength.color }}>{strength.label}</div>
          </div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48, duration: 0.4 }}
          whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(168, 85, 247, 0.5)' }}
          whileTap={{ scale: 0.98 }}
          type="submit" disabled={loading} style={buttonStyle}
        >{loading ? 'Creating account...' : 'Sign Up'}</motion.button>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.56 }}
          style={{ marginTop: '20px', fontSize: '14px', color: '#9ca3af', textAlign: 'center' }}
        >Already have an account? <Link to="/login" style={{ color: '#a855f7' }}>Login</Link></motion.p>
      </motion.form>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px 16px', marginBottom: '14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', padding: '13px', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '16px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' };

export default Signup;
