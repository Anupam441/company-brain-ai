import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppTheme } from '../context/ThemeContext';
import api from '../services/api';
import { getDeptTheme } from '../utils/departmentTheme';
import SidebarLayout from '../components/SidebarLayout';
function Settings({ workspace }) {
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const { t } = useAppTheme();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [saving, setSaving] = useState(false);
  const theme = getDeptTheme(workspace?.department);
  const handleToggle2FA = async () => {
    const newValue = !twoFactorEnabled;
    setSaving(true);
    try {
      const res = await api.patch('/auth/two-factor', { enabled: newValue });
      setTwoFactorEnabled(res.data.twoFactorEnabled);
      const token = localStorage.getItem('token');
      login({ ...user, twoFactorEnabled: res.data.twoFactorEnabled }, token);
      showToast(res.data.message, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update', 'error');
    } finally { setSaving(false); }
  };
  return (
    <SidebarLayout workspace={workspace} theme={theme}>
      <div style={{ padding: '36px 40px', maxWidth: '650px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '25px', margin: 0, color: t.text, fontWeight: 700, letterSpacing: '-0.3px' }}>⚙️ Settings</h1>
          <p style={{ color: t.textMuted, margin: '5px 0 0', fontSize: '13.5px' }}>Manage your account security.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: t.panelBg, border: `1px solid ${t.panelBorder}`, borderRadius: '14px', padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '14.5px', color: t.text, fontWeight: 600, marginBottom: '4px' }}>🔐 Two-Factor Authentication</div>
              <div style={{ fontSize: '12.5px', color: t.textMuted, lineHeight: '1.5', maxWidth: '380px' }}>
                Adds a verification code step after your password when logging in. Recommended for admin accounts.
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleToggle2FA}
              disabled={saving}
              style={{
                width: '46px', height: '26px', borderRadius: '14px', flexShrink: 0,
                background: twoFactorEnabled ? theme.color : t.inputBg,
                border: `1px solid ${twoFactorEnabled ? theme.color : t.panelBorder}`,
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
              }}
            >
              <motion.div
                animate={{ left: twoFactorEnabled ? '23px' : '3px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{ position: 'absolute', top: '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff' }}
              />
            </motion.button>
          </div>
          <div style={{
            marginTop: '16px', padding: '12px 14px', borderRadius: '10px',
            background: twoFactorEnabled ? 'rgba(34,197,94,0.08)' : t.inputBg,
            border: `1px solid ${twoFactorEnabled ? 'rgba(34,197,94,0.25)' : t.panelBorder}`,
            fontSize: '12px', color: twoFactorEnabled ? '#4ade80' : t.textFaint
          }}>
            {twoFactorEnabled ? '✓ Two-factor authentication is active on your account.' : 'Two-factor authentication is currently off.'}
          </div>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
export default Settings;
