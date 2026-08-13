import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAppTheme } from '../context/ThemeContext';
import { getDeptTheme } from '../utils/departmentTheme';
import SidebarLayout from '../components/SidebarLayout';
function Analytics() {
  const { t } = useAppTheme();
  const [workspace, setWorkspace] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { init(); }, []);
  const init = async () => {
    try {
      const wsRes = await api.get('/workspaces');
      if (wsRes.data.workspaces.length === 0) return;
      const ws = wsRes.data.workspaces[0];
      setWorkspace(ws);
      const [docRes, memRes] = await Promise.all([
        api.get(`/documents/${ws.id}`),
        api.get(`/workspaces/${ws.id}/members`)
      ]);
      setDocuments(docRes.data.documents);
      setMembers(memRes.data.members);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted }}>Loading...</div>;
  if (!workspace) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted }}>Create a workspace first.</div>;
  const theme = getDeptTheme(workspace.department);
  if (workspace.role !== 'admin') {
    return (
      <SidebarLayout workspace={workspace} theme={theme}>
        <div style={{ padding: '40px', color: t.textMuted }}>Analytics is only available to workspace admins.</div>
      </SidebarLayout>
    );
  }
  const statusCounts = { ready: 0, processing: 0, failed: 0 };
  documents.forEach((d) => { statusCounts[d.status] = (statusCounts[d.status] || 0) + 1; });
  const deptCounts = {};
  members.forEach((m) => { deptCounts[m.department] = (deptCounts[m.department] || 0) + 1; });
  const visibilityCounts = { public: 0, restricted: 0 };
  documents.forEach((d) => { visibilityCounts[d.visibility || 'public']++; });
  const maxDept = Math.max(1, ...Object.values(deptCounts));
  const maxStatus = Math.max(1, ...Object.values(statusCounts));
  return (
    <SidebarLayout workspace={workspace} theme={theme}>
      <div style={{ padding: '36px 40px', maxWidth: '1000px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '25px', margin: 0, color: t.text, fontWeight: 700, letterSpacing: '-0.3px' }}>📊 Analytics</h1>
          <p style={{ color: t.textMuted, margin: '5px 0 0', fontSize: '13.5px' }}>Overview of {workspace.name}'s knowledge base.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '22px' }}>
          <MiniStat label="Total Documents" value={documents.length} tint={theme.color} t={t} />
          <MiniStat label="Ready" value={statusCounts.ready} tint="#4ade80" t={t} />
          <MiniStat label="Team Members" value={members.length} tint="#60a5fa" t={t} />
          <MiniStat label="Restricted Docs" value={visibilityCounts.restricted} tint="#f87171" t={t} />
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={glassCard(t)}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: t.text, fontWeight: 600 }}>Documents by status</h3>
            {Object.entries(statusCounts).map(([status, count]) => (
              <BarRow key={status} label={status} value={count} max={maxStatus}
                color={status === 'ready' ? '#4ade80' : status === 'failed' ? '#f87171' : '#facc15'} t={t} />
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={glassCard(t)}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: t.text, fontWeight: 600 }}>Team by department</h3>
            {Object.keys(deptCounts).length === 0 && <p style={{ color: t.textFaint, fontSize: '12.5px' }}>No members yet.</p>}
            {Object.entries(deptCounts).map(([dept, count]) => (
              <BarRow key={dept} label={dept} value={count} max={maxDept} color={getDeptTheme(dept).color} t={t} />
            ))}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ ...glassCard(t), marginTop: '18px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '14px', color: t.text, fontWeight: 600 }}>Recent documents</h3>
          {documents.length === 0 && <p style={{ color: t.textFaint, fontSize: '12.5px' }}>No documents uploaded yet.</p>}
          {documents.slice(0, 6).map((doc) => (
            <div key={doc._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${t.panelBorder}` }}>
              <span style={{ fontSize: '13px', color: t.text }}>{doc.originalName}</span>
              <span style={{ fontSize: '11.5px', color: t.textFaint }}>{new Date(doc.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
function MiniStat({ label, value, tint, t }) {
  return (
    <div style={{ background: t.panelBg, border: `1px solid ${t.panelBorder}`, borderRadius: '12px', padding: '16px' }}>
      <div style={{ fontSize: '22px', fontWeight: 700, color: tint }}>{value}</div>
      <div style={{ fontSize: '11.5px', color: t.textMuted, marginTop: '4px' }}>{label}</div>
    </div>
  );
}
function BarRow({ label, value, max, color, t }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', color: t.textMuted, textTransform: 'capitalize' }}>{label}</span>
        <span style={{ fontSize: '12px', color: t.textFaint }}>{value}</span>
      </div>
      <div style={{ height: '6px', background: t.inputBg, borderRadius: '4px', overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
          style={{ height: '100%', background: color, borderRadius: '4px' }} />
      </div>
    </div>
  );
}
const glassCard = (t) => ({ background: t.panelBg, border: `1px solid ${t.panelBorder}`, borderRadius: '14px', padding: '22px' });
export default Analytics;
