import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppTheme } from '../context/ThemeContext';
import api from '../services/api';
import { getDeptTheme } from '../utils/departmentTheme';
import SidebarLayout from '../components/SidebarLayout';
import ConfirmModal from '../components/ConfirmModal';
import PreviewModal from '../components/PreviewModal';
const DEPARTMENTS = ['general', 'hr', 'engineering', 'sales', 'finance'];
function fileIcon(name = '') {
  const ext = name.split('.').pop().toLowerCase();
  if (ext === 'pdf') return { icon: '📕' };
  if (ext === 'docx' || ext === 'doc') return { icon: '📘' };
  return { icon: '📄' };
}
function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useAppTheme();
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
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
      showToast('Workspace created successfully', 'success');
    } catch (err) { showToast(err.response?.data?.message || 'Failed to create workspace', 'error'); }
  };
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length) setPendingFiles(files);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) setPendingFiles(files);
  };
  const removePendingFile = (idx) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };
  const toggleDept = (dept) => {
    setSelectedDepts((prev) => prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]);
  };
  const handleUploadConfirm = async () => {
    if (pendingFiles.length === 0 || !workspace) return;
    setUploading(true);
    setUploadProgress({ done: 0, total: pendingFiles.length });
    let successCount = 0;
    for (const file of pendingFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('visibility', workspace.role === 'admin' ? visibility : 'public');
      if (workspace.role === 'admin' && visibility === 'restricted') {
        formData.append('allowedDepartments', JSON.stringify(selectedDepts));
      }
      try {
        await api.post(`/documents/${workspace.id}/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        successCount++;
      } catch (err) {
        showToast(`Failed: ${file.name}`, 'error');
      }
      setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }
    loadDocuments(workspace.id);
    setPendingFiles([]);
    setVisibility('public');
    setSelectedDepts([]);
    setUploading(false);
    if (successCount > 0) showToast(`${successCount} document${successCount > 1 ? 's' : ''} uploaded — processing started`, 'success');
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/documents/${deleteTarget}`);
      loadDocuments(workspace.id);
      showToast('Document deleted', 'success');
    } catch (err) { showToast(err.response?.data?.message || 'Delete failed', 'error'); }
    finally { setDeleteTarget(null); }
  };
  const openPreview = async (docId) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const res = await api.get(`/documents/preview/${docId}`);
      setPreviewData(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load preview', 'error');
      setPreviewOpen(false);
    } finally { setPreviewLoading(false); }
  };
  useEffect(() => {
    if (!workspace) return;
    const interval = setInterval(() => loadDocuments(workspace.id), 5000);
    return () => clearInterval(interval);
  }, [workspace]);
  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted }}>Loading...</div>;
  }
  if (!workspace) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.form onSubmit={handleCreateWorkspace} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ ...glassCard(t), maxWidth: '420px', width: '100%' }}>
          <h1 style={{ fontSize: '20px', color: t.text, margin: '0 0 4px' }}>Hi, {user?.name} 👋</h1>
          <p style={{ color: t.textMuted, fontSize: '13px', margin: '0 0 20px' }}>Let's set up your workspace</p>
          <input type="text" placeholder="Workspace name (e.g. Acme Inc)" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} required style={inputStyle(t)} />
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" style={primaryButton()}>Create Workspace →</motion.button>
        </motion.form>
      </div>
    );
  }
  const theme = getDeptTheme(workspace.department);
  const isAdmin = workspace.role === 'admin';
  const readyCount = documents.filter((d) => d.status === 'ready').length;
  const processingCount = documents.filter((d) => d.status === 'processing').length;
  const filteredDocs = documents.filter((d) => d.originalName.toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <SidebarLayout workspace={workspace} theme={theme}>
      <div style={{ padding: '36px 40px', maxWidth: '1100px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px',
            borderRadius: '20px', background: theme.glow, marginBottom: '10px', fontSize: '11.5px', color: theme.color, fontWeight: 600
          }}>
            {theme.icon} {isAdmin ? 'Admin' : 'Member'} · {theme.label}
          </div>
          <h1 style={{ fontSize: '25px', margin: 0, color: t.text, fontWeight: 700, letterSpacing: '-0.3px' }}>
            {isAdmin ? `Welcome back, ${user?.name}` : `Hi, ${user?.name}`}
          </h1>
          <p style={{ color: t.textMuted, margin: '5px 0 0', fontSize: '13.5px' }}>
            {isAdmin ? "Here's what's happening in your workspace." : 'Browse documents or ask Company Brain a question.'}
          </p>
        </motion.div>
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
            <StatCard icon="📄" label="Documents" value={documents.length} tint="#a855f7" t={t} />
            <StatCard icon="✅" label="Ready to search" value={readyCount} tint="#4ade80" sub={processingCount > 0 ? `${processingCount} processing` : null} t={t} />
            <StatCard icon="👥" label="Team members" value={members.length} tint="#60a5fa" t={t} />
          </motion.div>
        )}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={glassCard(t)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '12px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: t.text, fontWeight: 600 }}>Documents</h3>
            <input
              type="text" placeholder="🔍 Search documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: '8px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.text, fontSize: '12.5px', outline: 'none', width: '220px' }}
            />
          </div>
          {pendingFiles.length === 0 ? (
            <motion.label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              whileHover={{ borderColor: theme.color }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '32px 20px', borderRadius: '12px', cursor: 'pointer', marginBottom: '20px',
                border: `1.5px dashed ${dragOver ? theme.color : t.panelBorder}`,
                background: dragOver ? theme.glow : t.inputBg,
                transition: 'background 0.15s'
              }}
            >
              <div style={{ fontSize: '26px', marginBottom: '8px' }}>📤</div>
              <div style={{ fontSize: '13.5px', color: t.text, fontWeight: 500, marginBottom: '3px' }}>
                Drop files here, or click to browse
              </div>
              <div style={{ fontSize: '11.5px', color: t.textFaint }}>PDF, DOCX, or TXT — multiple files supported</div>
              <input type="file" accept=".pdf,.docx,.txt" multiple onChange={handleFileSelect} style={{ display: 'none' }} />
            </motion.label>
          ) : (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              style={{ background: t.inputBg, border: `1px solid ${t.panelBorder}`, padding: '16px', borderRadius: '10px', marginBottom: '18px' }}>
              <div style={{ fontSize: '12.5px', color: t.textMuted, marginBottom: '10px' }}>{pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''} selected</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', maxHeight: '140px', overflowY: 'auto' }}>
                {pendingFiles.map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: t.text, padding: '4px 0' }}>
                    <span>{fileIcon(f.name).icon} {f.name}</span>
                    {!uploading && <button onClick={() => removePendingFile(i)} style={{ background: 'transparent', border: 'none', color: t.textFaint, cursor: 'pointer', fontSize: '13px' }}>✕</button>}
                  </div>
                ))}
              </div>
              {isAdmin && (
                <>
                  <p style={{ fontSize: '12px', color: t.textMuted, marginBottom: '8px' }}>Visibility (applies to all)</p>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    {['public', 'restricted'].map((v) => (
                      <button key={v} onClick={() => setVisibility(v)} style={{
                        padding: '6px 14px', borderRadius: '7px', fontSize: '12.5px', cursor: 'pointer',
                        border: `1px solid ${visibility === v ? theme.color : t.panelBorder}`,
                        background: visibility === v ? theme.glow : 'transparent',
                        color: visibility === v ? theme.color : t.textMuted
                      }}>{v === 'public' ? 'Everyone' : 'Specific departments'}</button>
                    ))}
                  </div>
                  {visibility === 'restricted' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                      {DEPARTMENTS.map((dept) => (
                        <button key={dept} onClick={() => toggleDept(dept)} style={{
                          padding: '5px 12px', borderRadius: '16px', fontSize: '11.5px', cursor: 'pointer', textTransform: 'capitalize',
                          border: `1px solid ${t.panelBorder}`,
                          background: selectedDepts.includes(dept) ? theme.color : 'transparent',
                          color: selectedDepts.includes(dept) ? '#fff' : t.textMuted
                        }}>{dept}</button>
                      ))}
                    </div>
                  )}
                </>
              )}
              {uploading && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11.5px', color: t.textMuted, marginBottom: '4px' }}>Uploading {uploadProgress.done}/{uploadProgress.total}…</div>
                  <div style={{ height: '5px', background: t.inputBg, borderRadius: '4px', overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }} style={{ height: '100%', background: theme.color }} />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <motion.button whileHover={{ scale: 1.02 }} onClick={handleUploadConfirm} disabled={uploading} style={{ ...primaryButton(theme), padding: '8px 18px', fontSize: '13px', width: 'auto' }}>
                  {uploading ? 'Uploading…' : `Upload ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''}`}
                </motion.button>
                {!uploading && <button onClick={() => setPendingFiles([])} style={ghostButton(t)}>Cancel</button>}
              </div>
            </motion.div>
          )}
          <div>
            {filteredDocs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0 4px', color: t.textFaint, fontSize: '13px' }}>
                {documents.length === 0 ? 'No documents yet.' : 'No documents match your search.'}
              </div>
            )}
            <AnimatePresence>
              {filteredDocs.map((doc) => {
                const fi = fileIcon(doc.originalName);
                return (
                  <motion.div key={doc._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    whileHover={{ background: t.hoverBg }} style={{ ...docRow, cursor: 'pointer' }}
                    onClick={() => openPreview(doc._id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0, background: t.inputBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{fi.icon}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13.5px', color: t.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px' }}>{doc.originalName}</div>
                        {doc.visibility === 'restricted' && (
                          <div style={{ fontSize: '11px', color: theme.color, marginTop: '2px' }}>🔒 {doc.allowedDepartments?.join(', ')}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <span style={statusBadge(doc.status)}>{doc.status}</span>
                      {isAdmin && <button onClick={() => setDeleteTarget(doc._id)} style={deleteBtn} title="Delete">🗑️</button>}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete this document?"
        message="This will permanently remove the document and its indexed content. This can't be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <PreviewModal
        open={previewOpen}
        loading={previewLoading}
        data={previewData}
        onClose={() => setPreviewOpen(false)}
        accentColor={theme.color}
      />
    </SidebarLayout>
  );
}
function StatCard({ icon, label, value, tint, sub, t }) {
  return (
    <motion.div whileHover={{ y: -2 }} style={{ background: t.panelBg, border: `1px solid ${t.panelBorder}`, borderRadius: '13px', padding: '18px' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${tint}1f`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', marginBottom: '14px' }}>{icon}</div>
      <div style={{ fontSize: '27px', fontWeight: 700, color: t.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: t.textMuted, marginTop: '5px' }}>{label}</div>
      {sub && <div style={{ fontSize: '10.5px', color: '#facc15', marginTop: '3px' }}>{sub}</div>}
    </motion.div>
  );
}
const glassCard = (t) => ({ background: t.panelBg, border: `1px solid ${t.panelBorder}`, borderRadius: '14px', padding: '24px' });
const inputStyle = (t) => ({ width: '100%', padding: '11px 14px', marginBottom: '14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: '9px', color: t.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' });
const primaryButton = (theme) => ({ padding: '11px 20px', background: `linear-gradient(135deg, ${theme?.color || '#a855f7'}, #3b82f6)`, border: 'none', borderRadius: '9px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', width: '100%' });
const ghostButton = (t) => ({ background: 'transparent', border: `1px solid ${t.panelBorder}`, borderRadius: '9px', color: t.textMuted, cursor: 'pointer', padding: '8px 18px', fontSize: '13px' });
const docRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 8px', borderRadius: '8px', margin: '0 -8px' };
const statusBadge = (status) => ({ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', fontWeight: 500, background: status === 'ready' ? 'rgba(34,197,94,0.12)' : status === 'failed' ? 'rgba(239,68,68,0.12)' : 'rgba(234,179,8,0.12)', color: status === 'ready' ? '#4ade80' : status === 'failed' ? '#f87171' : '#facc15' });
const deleteBtn = { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.5 };
export default Dashboard;
