import { useState, useEffect } from 'react';
import api from '../services/api';
const DEPARTMENTS = ['general', 'hr', 'engineering', 'sales', 'finance'];
function Team() {
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDept, setInviteDept] = useState('general');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  useEffect(() => {
    init();
  }, []);
  const init = async () => {
    try {
      const wsRes = await api.get('/workspaces');
      if (wsRes.data.workspaces.length === 0) return;
      const ws = wsRes.data.workspaces[0];
      setWorkspace(ws);
      loadMembers(ws.id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const loadMembers = async (workspaceId) => {
    try {
      const res = await api.get(`/workspaces/${workspaceId}/members`);
      setMembers(res.data.members);
    } catch (err) {
      console.error(err);
    }
  };
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await api.post(`/workspaces/${workspace.id}/invite`, {
        email: inviteEmail,
        role: inviteRole,
        department: inviteDept
      });
      setInviteEmail('');
      loadMembers(workspace.id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to invite');
    } finally {
      setInviting(false);
    }
  };
  const handleUpdateMember = async (memberId, field, value) => {
    try {
      await api.patch(`/workspaces/${workspace.id}/members/${memberId}`, { [field]: value });
      loadMembers(workspace.id);
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };
  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }
  if (!workspace) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Create a workspace first.</p>
      </div>
    );
  }
  const isAdmin = workspace.role === 'admin';
  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{
          margin: 0,
          background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>👥 Team</h2>
        <a href="/dashboard" style={{ color: '#9ca3af', fontSize: '14px', textDecoration: 'none' }}>← Dashboard</a>
      </div>
      {isAdmin && (
        <form onSubmit={handleInvite} style={glassCard}>
          <h3 style={{ marginTop: 0, fontSize: '16px' }}>Invite a member</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="Email (must already have an account)"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              style={{ ...inputStyle, flex: 2, marginBottom: 0, minWidth: '200px' }}
            />
            <select value={inviteDept} onChange={(e) => setInviteDept(e.target.value)} style={selectStyle}>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={selectStyle}>
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
            <button type="submit" disabled={inviting} style={primaryButton}>
              {inviting ? 'Inviting...' : 'Invite'}
            </button>
          </div>
        </form>
      )}
      <div style={glassCard}>
        <h3 style={{ marginTop: 0, fontSize: '16px' }}>Members ({members.length})</h3>
        {members.map((m) => (
          <div key={m.id} style={memberRow}>
            <div>
              <div style={{ fontWeight: 600 }}>{m.name}</div>
              <div style={{ fontSize: '13px', color: '#9ca3af' }}>{m.email}</div>
            </div>
            {isAdmin ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={m.department}
                  onChange={(e) => handleUpdateMember(m.id, 'department', e.target.value)}
                  style={selectStyle}
                >
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select
                  value={m.role}
                  onChange={(e) => handleUpdateMember(m.id, 'role', e.target.value)}
                  style={selectStyle}
                >
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#c4b5fd', textTransform: 'capitalize' }}>
                {m.role} · {m.department}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
const glassCard = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '20px'
};
const inputStyle = {
  padding: '12px 16px',
  marginBottom: '14px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '15px',
  outline: 'none',
  boxSizing: 'border-box'
};
const selectStyle = {
  padding: '10px 12px',
  background: '#1a1a2e',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '14px',
  outline: 'none'
};
const primaryButton = {
  padding: '11px 20px',
  background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
  border: 'none',
  borderRadius: '10px',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 600,
  cursor: 'pointer'
};
const memberRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 0',
  borderBottom: '1px solid rgba(255,255,255,0.08)'
};
export default Team;
