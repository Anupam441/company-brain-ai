import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAppTheme } from '../context/ThemeContext';
import { getDeptTheme } from '../utils/departmentTheme';
import SidebarLayout from '../components/SidebarLayout';
const DEPARTMENTS = ['general', 'hr', 'engineering', 'sales', 'finance'];
function Team() {
  const { showToast } = useToast();
  const { t } = useAppTheme();
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDept, setInviteDept] = useState('general');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  useEffect(() => { init(); }, []);
  const init = async () => {
    try {
      const wsRes = await api.get('/workspaces');
      if (wsRes.data.workspaces.length === 0) return;
      const ws = wsRes.data.workspaces[0];
      setWorkspace(ws);
      loadMembers(ws.id);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  const loadMembers = async (workspaceId) => {
    try {
      const res = await api.get(`/workspaces/${workspaceId}/members`);
      setMembers(res.data.members);
    } catch (err) { console.error(err); }
  };
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await api.post(`/workspaces/${workspace.id}/invite`, { email: inviteEmail, role: inviteRole, department: inviteDept });
      setInviteEmail('');
      loadMembers(workspace.id);
      showToast(`${inviteEmail} added to the team`, 'success');
    } catch (err) { showToast(err.response?.data?.message || 'Failed to invite', 'error'); }
    finally { setInviting(false); }
  };
  const handleUpdateMember = async (memberId, field, value) => {
    try {
      await api.patch(`/workspaces/${workspace.id}/members/${memberId}`, { [field]: value });
      loadMembers(workspace.id);
      showToast('Member updated', 'success');
    } catch (err) { showToast(err.response?.data?.message || 'Update failed', 'error'); }
  };
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted }}>Loading...</div>;
  if (!workspace) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted }}>Create a workspace first.</div>;
  const theme = getDeptTheme(workspace.department);
  const isAdmin = workspace.role === 'admin';
  return (
    <SidebarLayout workspace={workspace} theme={theme}>
      <div style={{ padding: '36px 40px', maxWidth: '1000px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '25px', margin: 0, color: t.text, fontWeight: 700, letterSpacing: '-0.3px' }}>Team</h1>
          <p style={{ color: t.textMuted, margin: '5px 0 0', fontSize: '13.5px' }}>
            {members.length} member{members.length !== 1 ? 's' : ''} in {workspace.name}
          </p>
        </motion.div>
        {isAdmin && (
          <motion.form onSubmit={handleInvite} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={glassCard(t)}>
            <h3 style={{ marginTop: 0, marginBottom: '14px', fontSize: '14px', color: t.text, fontWeight: 600 }}>Invite a member</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input type="email" placeholder="Email address" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required style={{ ...inputStyle(t), flex: 2, marginBottom: 0, minWidth: '220px' }} />
              <select value={inviteDept} onChange={(e) => setInviteDept(e.target.value)} style={selectStyle(t)}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={selectStyle(t)}>
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={inviting}
                style={{ padding: '10px 20px', background: `linear-gradient(135deg, ${theme.color}, #3b82f6)`, border: 'none', borderRadius: '9px', color: '#fff', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer' }}>
                {inviting ? 'Inviting…' : 'Invite'}
              </motion.button>
            </div>
          </motion.form>
        )}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ ...glassCard(t), marginTop: '18px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '4px', fontSize: '14px', color: t.text, fontWeight: 600 }}>Members</h3>
          <div style={{ marginTop: '14px' }}>
            <AnimatePresence>
              {members.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} exit={{ opacity: 0 }} style={{ ...memberRow, borderBottom: `1px solid ${t.panelBorder}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      background: `linear-gradient(135deg, ${getDeptTheme(m.department).color}, #3b82f6)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0
                    }}>{m.name?.[0]?.toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 600, color: t.text, fontSize: '13.5px' }}>{m.name}</div>
                      <div style={{ fontSize: '12px', color: t.textMuted }}>{m.email}</div>
                    </div>
                  </div>
                  {isAdmin ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select value={m.department} onChange={(e) => handleUpdateMember(m.id, 'department', e.target.value)} style={selectStyle(t)}>
                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <select value={m.role} onChange={(e) => handleUpdateMember(m.id, 'role', e.target.value)} style={selectStyle(t)}>
                        <option value="member">member</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
                  ) : (
                    <div style={{
                      fontSize: '11.5px', color: getDeptTheme(m.department).color, textTransform: 'capitalize',
                      background: getDeptTheme(m.department).glow, padding: '4px 12px', borderRadius: '20px', fontWeight: 500
                    }}>{m.role} · {m.department}</div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
const glassCard = (t) => ({ background: t.panelBg, border: `1px solid ${t.panelBorder}`, borderRadius: '14px', padding: '22px' });
const inputStyle = (t) => ({ padding: '10px 14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: '9px', color: t.text, fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' });
const selectStyle = (t) => ({ padding: '9px 10px', background: t.mode === 'dark' ? '#14141f' : '#ffffff', border: `1px solid ${t.inputBorder}`, borderRadius: '9px', color: t.text, fontSize: '12.5px', outline: 'none' });
const memberRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 4px' };
export default Team;
