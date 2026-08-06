import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
function Dashboard() {
  const { user, logout } = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  useEffect(() => {
    loadWorkspace();
  }, []);
  const loadWorkspace = async () => {
    try {
      const res = await api.get('/workspaces');
      if (res.data.workspaces.length > 0) {
        setWorkspace(res.data.workspaces[0]);
        loadDocuments(res.data.workspaces[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const loadDocuments = async (workspaceId) => {
    try {
      const res = await api.get(`/documents/${workspaceId}`);
      setDocuments(res.data.documents);
    } catch (err) {
      console.error(err);
    }
  };
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/workspaces', { name: newWorkspaceName });
      setWorkspace({ id: res.data.workspace._id, name: res.data.workspace.name, role: 'admin' });
      setNewWorkspaceName('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create workspace');
    }
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !workspace) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      await api.post(`/documents/${workspace.id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      loadDocuments(workspace.id);
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
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
    <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: 0 }}>Hi, {user?.name} 👋</h1>
          <p style={{ color: '#9ca3af', margin: '4px 0 0' }}>
            {workspace ? workspace.name : 'No workspace yet'}
          </p>
        </div>
        <button onClick={logout} style={secondaryButton}>Logout</button>
      </div>
      {!workspace ? (
        <form onSubmit={handleCreateWorkspace} style={glassCard}>
          <h3 style={{ marginTop: 0 }}>Create your first workspace</h3>
          <input
            type="text"
            placeholder="Workspace name (e.g. Acme Inc)"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            required
            style={inputStyle}
          />
          <button type="submit" style={primaryButton}>Create Workspace</button>
        </form>
      ) : (
        <>
          <div style={glassCard}>
            <h3 style={{ marginTop: 0 }}>📄 Documents</h3>
            <label style={{ ...primaryButton, display: 'inline-block', cursor: 'pointer' }}>
              {uploading ? 'Uploading...' : '+ Upload Document'}
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
            <div style={{ marginTop: '20px' }}>
              {documents.length === 0 && (
                <p style={{ color: '#9ca3af' }}>No documents yet. Upload one to get started.</p>
              )}
              {documents.map((doc) => (
                <div key={doc._id} style={docRow}>
                  <span>{doc.originalName}</span>
                  <span style={statusBadge(doc.status)}>{doc.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <a href="/chat" style={{ ...primaryButton, textDecoration: 'none', display: 'inline-block' }}>
              💬 Go to Chat
            </a>
          </div>
        </>
      )}
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
  width: '100%',
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
const secondaryButton = {
  padding: '10px 18px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '10px',
  color: '#fff',
  cursor: 'pointer'
};
const docRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid rgba(255,255,255,0.08)'
};
const statusBadge = (status) => ({
  fontSize: '12px',
  padding: '4px 10px',
  borderRadius: '20px',
  background: status === 'ready' ? 'rgba(34,197,94,0.15)' : status === 'failed' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)',
  color: status === 'ready' ? '#4ade80' : status === 'failed' ? '#f87171' : '#facc15'
});
export default Dashboard;
