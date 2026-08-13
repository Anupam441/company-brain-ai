import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAppTheme } from '../context/ThemeContext';
import { getDeptTheme } from '../utils/departmentTheme';
import SidebarLayout from '../components/SidebarLayout';
function actionIcon(action = '') {
  if (action.includes('uploaded')) return '📤';
  if (action.includes('deleted')) return '🗑️';
  if (action.includes('invited')) return '👋';
  if (action.includes('updated')) return '✏️';
  if (action.includes('created')) return '🏗️';
  return '📌';
}
function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function Activity() {
  const { t } = useAppTheme();
  const [workspace, setWorkspace] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { init(); }, []);
  const init = async () => {
    try {
      const wsRes = await api.get('/workspaces');
      if (wsRes.data.workspaces.length === 0) return;
      const ws = wsRes.data.workspaces[0];
      setWorkspace(ws);
      if (ws.role === 'admin') {
        const res = await api.get(`/workspaces/${ws.id}/audit-logs`);
        setLogs(res.data.logs);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted }}>Loading...</div>;
  if (!workspace) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted }}>Create a workspace first.</div>;
  const theme = getDeptTheme(workspace.department);
  if (workspace.role !== 'admin') {
    return (
      <SidebarLayout workspace={workspace} theme={theme}>
        <div style={{ padding: '40px', color: t.textMuted }}>Activity log is only available to workspace admins.</div>
      </SidebarLayout>
    );
  }
  return (
    <SidebarLayout workspace={workspace} theme={theme}>
      <div style={{ padding: '36px 40px', maxWidth: '800px' }}>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '25px', margin: 0, color: t.text, fontWeight: 700, letterSpacing: '-0.3px' }}>🕓 Activity</h1>
          <p style={{ color: t.textMuted, margin: '5px 0 0', fontSize: '13.5px' }}>Recent actions in {workspace.name}.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ background: t.panelBg, border: `1px solid ${t.panelBorder}`, borderRadius: '14px', padding: '8px 22px' }}>
          {logs.length === 0 && (
            <div style={{ padding: '30px 0', textAlign: 'center', color: t.textFaint, fontSize: '13px' }}>No activity yet.</div>
          )}
          {logs.map((log, i) => (
            <motion.div key={log._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0',
                borderBottom: i < logs.length - 1 ? `1px solid ${t.panelBorder}` : 'none'
              }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px', background: t.inputBg, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px'
              }}>{actionIcon(log.action)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', color: t.text }}>
                  <span style={{ fontWeight: 600 }}>{log.user?.name || 'Someone'}</span>
                  {' '}{log.action}
                  {log.targetName && <span style={{ color: theme.color }}> · {log.targetName}</span>}
                </div>
                <div style={{ fontSize: '11.5px', color: t.textFaint, marginTop: '2px' }}>{log.user?.email}</div>
              </div>
              <div style={{ fontSize: '11.5px', color: t.textFaint, flexShrink: 0 }}>{timeAgo(log.createdAt)}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </SidebarLayout>
  );
}
export default Activity;
