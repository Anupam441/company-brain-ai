import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAppTheme } from '../context/ThemeContext';
import { getDeptTheme } from '../utils/departmentTheme';
import SidebarLayout from '../components/SidebarLayout';
function Chat() {
  const { t } = useAppTheme();
  const [workspace, setWorkspace] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => { init(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  const init = async () => {
    try {
      const wsRes = await api.get('/workspaces');
      if (wsRes.data.workspaces.length === 0) { navigate('/dashboard'); return; }
      const ws = wsRes.data.workspaces[0];
      setWorkspace(ws);
      await loadConversations(ws.id);
      await startNewConversation(ws.id);
    } catch (err) { console.error(err); }
    finally { setInitializing(false); }
  };
  const loadConversations = async (workspaceId) => {
    try {
      const res = await api.get(`/workspaces/${workspaceId}/conversations`);
      setConversations(res.data.conversations);
    } catch (err) { console.error(err); }
  };
  const startNewConversation = async (workspaceId) => {
    const convRes = await api.post(`/workspaces/${workspaceId}/conversations`);
    setConversationId(convRes.data.conversation._id);
    setMessages([]);
  };
  const openConversation = async (convId) => {
    setConversationId(convId);
    try {
      const res = await api.get(`/conversations/${convId}/messages`);
      setMessages(res.data.messages.map((m) => ({
        id: m._id, sender: m.sender, content: m.content, citedDocuments: m.citedDocuments, feedback: m.feedback
      })));
    } catch (err) { console.error(err); }
  };
  const handleNewChat = async () => {
    if (!workspace) return;
    await startNewConversation(workspace.id);
  };
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending || !conversationId) return;
    const question = input;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', content: question }]);
    setSending(true);
    try {
      const res = await api.post(`/conversations/${conversationId}/messages`, { question });
      setMessages((prev) => [...prev, {
        id: res.data.messageId, sender: 'ai', content: res.data.answer, citedDocuments: res.data.citedDocuments, feedback: null
      }]);
      loadConversations(workspace.id);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'ai', content: 'Sorry, something went wrong. Please try again.', citedDocuments: [] }]);
    } finally { setSending(false); }
  };
  const handleFeedback = async (messageId, value) => {
    if (!messageId) return;
    const current = messages.find((m) => m.id === messageId)?.feedback;
    const newValue = current === value ? null : value;
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, feedback: newValue } : m));
    try {
      await api.patch(`/messages/${messageId}/feedback`, { feedback: newValue });
    } catch (err) { console.error(err); }
  };
  if (initializing || !workspace) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textMuted }}>Loading...</div>;
  }
  const theme = getDeptTheme(workspace.department);
  const suggestions = ["What is our leave policy?", "Summarize the onboarding process", "What documents do you have access to?"];
  return (
    <SidebarLayout workspace={workspace} theme={theme}>
      <div style={{ height: '100vh', display: 'flex' }}>
        <div style={{
          width: '220px', flexShrink: 0, padding: '20px 12px', borderRight: `1px solid ${t.panelBorder}`,
          display: 'flex', flexDirection: 'column', overflowY: 'auto'
        }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleNewChat}
            style={{
              padding: '9px 12px', borderRadius: '9px', border: `1px solid ${theme.color}55`,
              background: theme.glow, color: theme.color, fontSize: '12.5px', fontWeight: 600,
              cursor: 'pointer', marginBottom: '16px', textAlign: 'left'
            }}>+ New chat</motion.button>
          <div style={{ fontSize: '10.5px', color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 6px', marginBottom: '8px' }}>History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {conversations.length === 0 && <p style={{ fontSize: '11.5px', color: t.textFaint, padding: '0 6px' }}>No past conversations yet.</p>}
            {conversations.map((c) => (
              <motion.div key={c._id} whileHover={{ background: t.hoverBg }} onClick={() => openConversation(c._id)}
                style={{
                  padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                  color: conversationId === c._id ? t.text : t.textMuted,
                  background: conversationId === c._id ? t.hoverBg : 'transparent',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>{c.title}</motion.div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '780px', margin: '0 auto', padding: '28px 32px' }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '16px' }}>
            <h1 style={{ fontSize: '20px', margin: 0, color: t.text, fontWeight: 700, letterSpacing: '-0.3px' }}>{theme.icon} Ask Company Brain</h1>
            <p style={{ color: t.textMuted, margin: '4px 0 0', fontSize: '13px' }}>Answers are grounded in your workspace's documents.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ flex: 1, overflowY: 'auto', background: t.panelBg, border: `1px solid ${t.panelBorder}`, borderRadius: '14px', padding: '20px', marginBottom: '14px' }}>
            {messages.length === 0 && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🧠</div>
                <p style={{ color: t.textMuted, fontSize: '13.5px', marginBottom: '18px' }}>Ask anything about your company's documents.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '380px' }}>
                  {suggestions.map((s, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.02, borderColor: theme.color }} onClick={() => setInput(s)}
                      style={{ padding: '10px 14px', borderRadius: '9px', border: `1px solid ${t.panelBorder}`, background: t.inputBg, color: t.text, fontSize: '12.5px', textAlign: 'left', cursor: 'pointer' }}>{s}</motion.button>
                  ))}
                </div>
              </div>
            )}
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '14px' }}>
                  <div style={{ maxWidth: '78%' }}>
                    <div style={{
                      padding: '11px 15px', borderRadius: '13px', fontSize: '14px', lineHeight: '1.55',
                      background: msg.sender === 'user' ? `linear-gradient(135deg, ${theme.color}, #3b82f6)` : t.inputBg,
                      color: msg.sender === 'user' ? '#fff' : t.text
                    }}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                      {msg.citedDocuments?.length > 0 && (
                        <div style={{ marginTop: '9px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {msg.citedDocuments.map((doc, i) => (
                            <span key={i} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: theme.glow, border: `1px solid ${theme.color}55`, color: theme.color }}>📄 {doc.documentName}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.sender === 'ai' && msg.id && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', paddingLeft: '4px' }}>
                        <button onClick={() => handleFeedback(msg.id, 'up')} style={feedbackBtn(msg.feedback === 'up', '#4ade80', t)}>👍</button>
                        <button onClick={() => handleFeedback(msg.id, 'down')} style={feedbackBtn(msg.feedback === 'down', '#f87171', t)}>👎</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {sending && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                  style={{ padding: '11px 15px', borderRadius: '13px', background: t.inputBg, color: t.textMuted, fontSize: '13px' }}>Thinking…</motion.div>
              </div>
            )}
            <div ref={bottomRef} />
          </motion.div>
          <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
            <input type="text" placeholder="Ask about your documents…" value={input} onChange={(e) => setInput(e.target.value)} disabled={sending}
              style={{ flex: 1, padding: '13px 16px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: '11px', color: t.text, fontSize: '14px', outline: 'none' }} />
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} type="submit" disabled={sending || !input.trim()}
              style={{ padding: '13px 22px', background: `linear-gradient(135deg, ${theme.color}, #3b82f6)`, border: 'none', borderRadius: '11px', color: '#fff', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer', opacity: sending || !input.trim() ? 0.6 : 1 }}>Send</motion.button>
          </motion.form>
        </div>
      </div>
    </SidebarLayout>
  );
}
function feedbackBtn(active, color, t) {
  return {
    background: active ? `${color}22` : 'transparent',
    border: `1px solid ${active ? color : t.panelBorder}`,
    borderRadius: '6px', padding: '3px 8px', fontSize: '12px', cursor: 'pointer',
    opacity: active ? 1 : 0.6
  };
}
export default Chat;
