import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getDeptTheme } from '../utils/departmentTheme';

const DEPARTMENTS = ['general', 'hr', 'engineering', 'sales', 'finance'];

function Dashboard() {
  const { user, logout } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [pendingFile, setPendingFile] = useState(null);

  useEffect(() => { loadWorkspace(); }, []);

  const loadWorkspace = async () => {
    try {
      const res = await api.get('/workspaces');
      if (res.data.workspaces.length > 0) {
        const ws = res.data.workspaces[0];
        setWorkspace(ws);
        loadDocuments(ws.id);
        loadMembers(ws.id);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadDocuments = async (workspaceId) => {
    try {
      const res = await api.get(`/documents/${workspaceId}`);
      setDocuments(res.data.documents);
    } catch (err) { console.error(err); }
  };

  const loadMembers = async (workspaceId) => {
    try {
      const res = await api.get(`/workspaces/${workspaceId}/members`);
      setMembers(res.data.members);
    } catch (err) { console.error(err); }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/workspaces', { name: newWorkspaceName });
      setWorkspace({ id: res.data.workspace._id, name: res.data.workspace.name, role: 'admin', department: 'general' });
      setNewWorkspaceName('');
    } catch (err) { alert(err.response?.data?.message || 'Failed to create workspace'); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setPendingFile(file);
  };

  const handleUploadConfirm = async () => {
    if (!pendingFile || !workspace) return;
    const formData = new FormData();
    formData.append('file', pendingFile);
    formData.append('visibility', workspace.role === 'admin' ? visibility : 'public');
    if (workspace.role === 'admin' && visibility === 'restricted') {
      formData.append('allowedDepartments', JSON.stringify(selectedDepts));
    }
    setUploading(true);
    try {
      await api.post(`/documents/${workspace.id}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      loadDocuments(workspace.id);
      setPendingFile(null);
      setVisibility('public');
      setSelectedDepts([]);
    } catch (err) { alert(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const toggleDept = (dept) => {
    setSelectedDepts((prev) => prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]);
  };

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      loadDocuments(workspace.id);
    } catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  };

  useEffect(() => {
    if (!workspace) return;
    const interval = setInterval(() => loadDocuments(workspace.id), 5000);
    return () => clearInterval(interval);
  }, [workspace]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!workspace) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.form onSubmit={handleCreateWorkspace} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ ...glassCard, maxWidth: '400px', width: '100%' }}>
          <h1 style={{ fontSize: '22px' }}>Hi, {user?.name} 👋</h1>
          <h3 style={{ marginTop: 0 }}>Create your first workspace</h3>
          <input type="text" placeholder="Workspace name (e.g. Acme Inc)" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} required style={inputStyle} />
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="submit" style={primaryButton}>Create Workspace</motion.button>
        </motion.form>
      </div>
    );
  }

  const theme = getDeptTheme(workspace.department);
  const isAdmin = workspace.role === 'admin';

  const sharedProps = {
    user, workspace, documents, members, theme, logout,
    pendingFile, visibility, selectedDepts, uploading,
    handleFileSelect, handleUploadConfirm, toggleDept, setPendingFile, setVisibility, handleDelete
  };

  return isAdmin ? <AdminView {...sharedProps} /> : <MemberView {...sharedProps} />;
}

// ============ ADMIN VIEW ============
function AdminView({ user, workspace, documents, members, theme, logout, pendingFile, visibility, selectedDepts, uploading, handleFileSelect, handleUploadConfirm, toggleDept, setPendingFile, setVisibility, handleDelete }) {
  const readyCount = documents.filter((d) => d.status === 'ready').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '850px', margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: '20px', background: theme.glow, marginBottom: '8px', fontSize: '12px' }}>
            {theme.icon} Admin · {theme.label}
          </div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Hi, {user?.name} 👋</h1>
          <p style={{ color: '#9ca3af', margin: '4px 0 0' }}>{workspace.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <motion.a whileHover={{ scale: 1.05 }} href="/team" style={secondaryButton}>👥 Team</motion.a>
          <motion.button whileHover={{ scale: 1.05 }} onClick={logout} style={secondaryButton}>Logout</motion.button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Documents" value={documents.length} color={theme.color} />
        <StatCard label="Ready" value={readyCount} color="#4ade80" />
        <StatCard label="Team Members" value={members.length} color={theme.color} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={glassCard}>
        <h3 style={{ marginTop: 0 }}>📄 Documents</h3>

        {!pendingFile ? (
          <motion.label whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ ...primaryButton(theme), display: 'inline-block', cursor: 'pointer' }}>
            + Choose File
            <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileSelect} style={{ display: 'none' }} />
          </motion.label>
        ) : (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '14px' }}>📎 {pendingFile.name}</p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>Who can see this document?</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <label style={radioLabel}><input type="radio" checked={visibility === 'public'} onChange={() => setVisibility('public')} /> Everyone</label>
              <label style={radioLabel}><input type="radio" checked={visibility === 'restricted'} onChange={() => setVisibility('restricted')} /> Specific departments</label>
            </div>
            {visibility === 'restricted' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {DEPARTMENTS.map((dept) => (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="button" key={dept} onClick={() => toggleDept(dept)}
                    style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)', background: selectedDepts.includes(dept) ? `linear-gradient(135deg, ${theme.color}, #3b82f6)` : 'transparent', color: '#fff', fontSize: '13px', cursor: 'pointer', textTransform: 'capitalize' }}
                  >{dept}</motion.button>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <motion.button whileHover={{ scale: 1.03 }} onClick={handleUploadConfirm} disabled={uploading} style={primaryButton(theme)}>{uploading ? 'Uploading...' : 'Upload'}</motion.button>
              <motion.button whileHover={{ scale: 1.03 }} onClick={() => setPendingFile(null)} style={secondaryButton}>Cancel</motion.button>
            </div>
          </motion.div>
        )}

        <div style={{ marginTop: '20px' }}>
          {documents.length === 0 && <p style={{ color: '#9ca3af' }}>No documents yet. Upload one to get started.</p>}
          <AnimatePresence>
            {documents.map((doc) => (
              <motion.div key={doc._id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 15 }} style={docRow}>
                <span>
                  {doc.originalName}
                  {doc.visibility === 'restricted' && <span style={{ fontSize: '11px', color: theme.color, marginLeft: '8px' }}>🔒 {doc.allowedDepartments?.join(', ')}</span>}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={statusBadge(doc.status)}>{doc.status}</span>
                  <motion.button whileHover={{ scale: 1.2 }} onClick={() => handleDelete(doc._id)} style={deleteBtn}>🗑️</motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ textAlign: 'center', marginTop: '24px' }}>
        <motion.a whileHover={{ scale: 1.05, boxShadow: `0 0 25px ${theme.glow}` }} href="/chat" style={{ ...primaryButton(theme), textDecoration: 'none', display: 'inline-block' }}>💬 Go to Chat</motion.a>
      </motion.div>
    </motion.div>
  );
}

// ============ MEMBER VIEW ============
function MemberView({ user, workspace, documents, theme, logout, pendingFile, uploading, handleFileSelect, handleUploadConfirm, setPendingFile }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '650px', margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', background: theme.glow, marginBottom: '14px', fontSize: '14px' }}>
          {theme.icon} {theme.label} Team
        </div>
        <h1 style={{ fontSize: '26px', margin: '0 0 4px' }}>Welcome, {user?.name} 👋</h1>
        <p style={{ color: '#9ca3af', margin: 0 }}>{workspace.name}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '14px' }}>
          <motion.a whileHover={{ scale: 1.05, boxShadow: `0 0 25px ${theme.glow}` }} href="/chat" style={{ ...primaryButton(theme), textDecoration: 'none' }}>💬 Ask Company Brain</motion.a>
          <motion.a whileHover={{ scale: 1.05 }} href="/team" style={secondaryButton}>👥 Team</motion.a>
          <motion.button whileHover={{ scale: 1.05 }} onClick={logout} style={secondaryButton}>Logout</motion.button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={glassCard}>
        <h3 style={{ marginTop: 0 }}>📄 Your Accessible Documents</h3>

        {!pendingFile ? (
          <motion.label whileHover={{ scale: 1.03 }} style={{ ...primaryButton(theme), display: 'inline-block', cursor: 'pointer', fontSize: '14px' }}>
            + Share a document (visible to everyone)
            <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileSelect} style={{ display: 'none' }} />
          </motion.label>
        ) : (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ background: 'rgba(255,255,255,0.04)', padding: '14px', borderRadius: '12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>📎 {pendingFile.name}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.button whileHover={{ scale: 1.05 }} onClick={handleUploadConfirm} disabled={uploading} style={primaryButton(theme)}>{uploading ? '...' : 'Upload'}</motion.button>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setPendingFile(null)} style={secondaryButton}>✕</motion.button>
            </div>
          </motion.div>
        )}

        <div style={{ marginTop: '16px' }}>
          {documents.length === 0 && <p style={{ color: '#9ca3af', fontSize: '14px' }}>No documents available to you yet.</p>}
          <AnimatePresence>
            {documents.map((doc) => (
              <motion.div key={doc._id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} style={docRow}>
                <span>{doc.originalName}</span>
                <span style={statusBadge(doc.status)}>{doc.status}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <motion.div whileHover={{ y: -3 }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '26px', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{label}</div>
    </motion.div>
  );
}

const glassCard = { background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '24px', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '12px 16px', marginBottom: '14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' };
const primaryButton = (theme) => ({ padding: '11px 20px', background: theme ? `linear-gradient(135deg, ${theme.color}, #3b82f6)` : 'linear-gradient(135deg, #a855f7, #3b82f6)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer' });
const secondaryButton = { padding: '10px 18px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', cursor: 'pointer', textDecoration: 'none', fontSize: '14px' };
const docRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' };
const statusBadge = (status) => ({ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: status === 'ready' ? 'rgba(34,197,94,0.15)' : status === 'failed' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)', color: status === 'ready' ? '#4ade80' : status === 'failed' ? '#f87171' : '#facc15' });
const radioLabel = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' };
const deleteBtn = { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px' };

export default Dashboard;
