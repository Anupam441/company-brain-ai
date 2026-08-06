import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
const DEPARTMENTS = ['general', 'hr', 'engineering', 'sales', 'finance'];
function Dashboard() {
  const { user, logout } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
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
        setWorkspace(res.data.workspaces[0]);
        loadDocuments(res.data.workspaces[0].id);
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
    formData.append('visibility', visibility);
    if (visibility === 'restricted') formData.append('allowedDepartments', JSON.stringify(selectedDepts));
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
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}
      >
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Hi, {user?.name} 👋</h1>
          <p style={{ color: '#9ca3af', margin: '4px 0 0' }}>
            {workspace ? `${workspace.name} · ${workspace.role} · ${workspace.department || 'general'}` : 'No workspace yet'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {workspace && <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} href="/team" style={secondaryButton}>👥 Team</motion.a>}
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={logout} style={secondaryButton}>Logout</motion.button>
        </div>
      </motion.div>
      {!workspace ? (
        <motion.form
          onSubmit={handleCreateWorkspace}
          initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.15, duration: 0.5 }}
          style={glassCard}
        >
          <h3 style={{ marginTop: 0 }}>Create your first workspace</h3>
          <input type="text" placeholder="Workspace name (e.g. Acme Inc)" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} required style={inputStyle} />
          <motion.button whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(168,85,247,0.4)' }} whileTap={{ scale: 0.97 }} type="submit" style={primaryButton}>Create Workspace</motion.button>
        </motion.form>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
            style={glassCard}
          >
            <h3 style={{ marginTop: 0 }}>📄 Documents</h3>
            {!pendingFile ? (
              <motion.label whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ ...primaryButton, display: 'inline-block', cursor: 'pointer' }}>
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
                        style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.15)', background: selectedDepts.includes(dept) ? 'linear-gradient(135deg, #a855f7, #3b82f6)' : 'transparent', color: '#fff', fontSize: '13px', cursor: 'pointer', textTransform: 'capitalize' }}
                      >{dept}</motion.button>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleUploadConfirm} disabled={uploading} style={primaryButton}>{uploading ? 'Uploading...' : 'Upload'}</motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setPendingFile(null)} style={secondaryButton}>Cancel</motion.button>
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
                      {doc.visibility === 'restricted' && <span style={{ fontSize: '11px', color: '#c4b5fd', marginLeft: '8px' }}>🔒 {doc.allowedDepartments?.join(', ')}</span>}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <motion.span animate={doc.status === 'processing' ? { opacity: [1, 0.5, 1] } : {}} transition={{ repeat: Infinity, duration: 1.2 }} style={statusBadge(doc.status)}>{doc.status}</motion.span>
                      {workspace.role === 'admin' && <motion.button whileHover={{ scale: 1.2 }} onClick={() => handleDelete(doc._id)} style={deleteBtn}>🗑️</motion.button>}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} style={{ textAlign: 'center', marginTop: '24px' }}>
            <motion.a whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(168,85,247,0.5)' }} whileTap={{ scale: 0.97 }} href="/chat" style={{ ...primaryButton, textDecoration: 'none', display: 'inline-block' }}>💬 Go to Chat</motion.a>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
const glassCard = { background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '24px', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '12px 16px', marginBottom: '14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' };
const primaryButton = { padding: '11px 20px', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '15px', fontWeight: 600, cursor: 'pointer' };
const secondaryButton = { padding: '10px 18px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: '#fff', cursor: 'pointer', textDecoration: 'none', fontSize: '14px' };
const docRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' };
const statusBadge = (status) => ({ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: status === 'ready' ? 'rgba(34,197,94,0.15)' : status === 'failed' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)', color: status === 'ready' ? '#4ade80' : status === 'failed' ? '#f87171' : '#facc15' });
const radioLabel = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' };
const deleteBtn = { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '15px' };
export default Dashboard;
