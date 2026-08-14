import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppTheme } from '../context/ThemeContext';
import api from '../services/api';
import { getDeptTheme } from '../utils/departmentTheme';
import SidebarLayout from '../components/SidebarLayout';
import ConfirmModal from '../components/ConfirmModal';

function Settings({ workspace, onWorkspaceRenamed }) {
  const { user, login, logout } = useAuth();
  const { showToast } = useToast();
  const { t } = useAppTheme();
  const navigate = useNavigate();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [saving2fa, setSaving2fa] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [workspaceName, setWorkspaceName] = useState(workspace?.name || '');
  const [savingWorkspace, setSavingWorkspace] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const theme = getDeptTheme(workspace?.department);
  const isAdmin = workspace?.role === 'admin';

  const handleToggle2FA = async () => {
    const newValue = !twoFactorEnabled;
    setSaving2fa(true);
    try {
      const res = await api.patch('/auth/two-factor', { enabled: newValue });
      setTwoFactorEnabled(res.data.twoFactorEnabled);
      const token = localStorage.getItem('token');
      login({ ...user, twoFactorEnabled: res.data.twoFactorEnabled }, token);
      showToast(res.data.message, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update', 'error');
    } finally { setSaving2fa(false); }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.patch('/auth/profile', { name });
      const token = localStorage.getItem('token');
      login(res.data.user, token);
      showToast('Profile updated', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api.patch('/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      showToast('Password changed successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally { setSavingPassword(false); }
  };

  const handleRenameWorkspace = async (e) => {
    e.preventDefault();
    setSavingWorkspace(true);
    try {
      await api.patch(`/workspaces/${workspace.id}`, { name: workspaceName });
      showToast('Workspace renamed', 'success');
      if (onWorkspaceRenamed) onWorkspaceRenamed(workspaceName);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to rename workspace', 'error');
    } finally { setSavingWorkspace(false); }
  };

  const handleDeleteWorkspace = async () => {
    setDeleting(true);
    try {
      await api.delete(`/workspaces/${workspace.id}`);
      showToast('Workspace deleted', 'success');
      logout();
      navigate('/login');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete workspace', 'error');
    } finally { setDeleting(false); setDeleteConfirmOpen(false); }
  };

  return (
    <SidebarLayout workspace={workspace} theme={theme}>
      <div style={{ padding: '36px 40px', maxWidth: '650px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '25px', margin: 0, color: t.text, fontWeight: 700, letterSpacing: '-0.3px' }}>⚙️ Settings</h1>
          <p style={{ color: t.textMuted, margin: '5px 0 0', fontSize: '13.5px' }}>Manage your account and workspace.</p>
        </motion.div>

        {/* Profile */}
        <motion.form onSubmit={handleSaveProfile} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} style={card(t)}>
          <h3 style={cardTitle(t)}>👤 Profile</h3>
          <label style={label(t)}>Display name</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ ...input(t), marginBottom: 0, flex: 1 }} />
            <button type="submit" disabled={savingProfile || name === user?.name} style={btn(theme, savingProfile || name === user?.name)}>
              {savingProfile ? 'Saving…' : 'Save'}
            </button>
          </div>
          <div style={{ fontSize: '11.5px', color: t.textFaint, marginTop: '10px' }}>Email: {user?.email} (cannot be changed)</div>
        </motion.form>

        {/* Change password */}
        <motion.form onSubmit={handleChangePassword} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} style={card(t)}>
          <h3 style={cardTitle(t)}>🔑 Change Password</h3>
          <label style={label(t)}>Current password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={input(t)} required />
          <label style={label(t)}>New password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ ...input(t), marginBottom: '14px' }} required minLength={6} />
          <button type="submit" disabled={savingPassword} style={btn(theme, savingPassword)}>
            {savingPassword ? 'Updating…' : 'Update Password'}
          </button>
        </motion.form>

        {/* 2FA */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }} style={card(t)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
            <div>
              <h3 style={{ ...cardTitle(t), marginBottom: '4px' }}>🔐 Two-Factor Authentication</h3>
              <div style={{ fontSize: '12.5px', color: t.textMuted, lineHeight: '1.5', maxWidth: '380px' }}>
                Adds a verification code step after your password when logging in.
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleToggle2FA} disabled={saving2fa} style={toggleStyle(theme, t, twoFactorEnabled)}>
              <motion.div animate={{ left: twoFactorEnabled ? '23px' : '3px' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} style={toggleDot} />
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

        {isAdmin && (
          <>
            {/* Workspace rename */}
            <motion.form onSubmit={handleRenameWorkspace} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} style={card(t)}>
              <h3 style={cardTitle(t)}>🏢 Workspace Name</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} style={{ ...input(t), marginBottom: 0, flex: 1 }} required />
                <button type="submit" disabled={savingWorkspace || workspaceName === workspace?.name} style={btn(theme, savingWorkspace || workspaceName === workspace?.name)}>
                  {savingWorkspace ? 'Saving…' : 'Rename'}
                </button>
              </div>
            </motion.form>

            {/* Danger zone */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ ...card(t), border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}>
              <h3 style={{ ...cardTitle(t), color: '#f87171' }}>⚠️ Danger Zone</h3>
              <p style={{ fontSize: '12.5px', color: t.textMuted, marginBottom: '14px', lineHeight: '1.5' }}>
                Permanently delete this workspace, including all documents, members, and chat history. This cannot be undone.
              </p>
              <button onClick={() => setDeleteConfirmOpen(true)} style={{
                padding: '9px 18px', borderRadius: '9px', border: '1px solid rgba(239,68,68,0.4)',
                background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
              }}>Delete Workspace</button>
            </motion.div>
          </>
        )}
      </div>

      <ConfirmModal
        open={deleteConfirmOpen}
        title={`Delete "${workspace?.name}"?`}
        message="This permanently deletes all documents, team members, chat history, and activity logs for this workspace. This action cannot be undone."
        onConfirm={handleDeleteWorkspace}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </SidebarLayout>
  );
}

const card = (t) => ({ background: t.panelBg, border: `1px solid ${t.panelBorder}`, borderRadius: '14px', padding: '22px', marginBottom: '16px' });
const cardTitle = (t) => ({ margin: '0 0 14px', fontSize: '14.5px', color: t.text, fontWeight: 600 });
const label = (t) => ({ display: 'block', fontSize: '12px', color: t.textMuted, marginBottom: '6px' });
const input = (t) => ({ width: '100%', padding: '10px 14px', marginBottom: '14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: '9px', color: t.text, fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' });
const btn = (theme, disabled) => ({ padding: '10px 20px', background: disabled ? '#3f3f52' : `linear-gradient(135deg, ${theme.color}, #3b82f6)`, border: 'none', borderRadius: '9px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1 });
const toggleStyle = (theme, t, on) => ({ width: '46px', height: '26px', borderRadius: '14px', flexShrink: 0, background: on ? theme.color : t.inputBg, border: `1px solid ${on ? theme.color : t.panelBorder}`, position: 'relative', cursor: 'pointer' });
const toggleDot = { position: 'absolute', top: '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff' };

export default Settings;
