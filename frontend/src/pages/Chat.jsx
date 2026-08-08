import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

function Chat() {
  const [workspaceId, setWorkspaceId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { init(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const init = async () => {
    try {
      const wsRes = await api.get('/workspaces');
      if (wsRes.data.workspaces.length === 0) { navigate('/dashboard'); return; }
      const wsId = wsRes.data.workspaces[0].id;
      setWorkspaceId(wsId);
      await loadConversations(wsId);
    } catch (err) { console.error(err); }
    finally { setInitializing(false); }
  };

  const loadConversations = async (wsId) => {
    try {
      const res = await api.get(`/workspaces/${wsId}/conversations`);
      setConversations(res.data.conversations);
      return res.data.conversations;
    } catch (err) { console.error(err); return []; }
  };

  const startNewConversation = async (wsId) => {
    const convRes = await api.post(`/workspaces/${wsId}/conversations`);
    const newConv = convRes.data.conversation;
    setConversations((prev) => [newConv, ...prev]);
    setConversationId(newConv._id);
    setMessages([]);
  };

  const openConversation = async (conv) => {
    setConversationId(conv._id);
    setMessages([]);
    try {
      const res = await api.get(`/conversations/${conv._id}/messages`);
      setMessages(res.data.messages.map((m) => ({ sender: m.sender, content: m.content, citedDocuments: m.citedDocuments })));
    } catch (err) { console.error(err); }
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await api.delete(`/conversations/${convId}`);
      const updated = conversations.filter((c) => c._id !== convId);
      setConversations(updated);
      if (conversationId === convId) {
        if (updated.length > 0) openConversation(updated[0]);
        else startNewConversation(workspaceId);
      }
    } catch (err) { console.error(err); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    let activeConvId = conversationId;
    if (!activeConvId) {
      const convRes = await api.post(`/workspaces/${workspaceId}/conversations`);
      activeConvId = convRes.data.conversation._id;
      setConversationId(activeConvId);
      setConversations((prev) => [convRes.data.conversation, ...prev]);
    }

    const question = input;
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', content: question }]);
    setSending(true);
    try {
      const res = await api.post(`/conversations/${activeConvId}/messages`, { question });
      setMessages((prev) => [...prev, { sender: 'ai', content: res.data.answer, citedDocuments: res.data.citedDocuments }]);
      loadConversations(workspaceId);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'ai', content: 'Sorry, something went wrong. Please try again.', citedDocuments: [] }]);
    } finally { setSending(false); }
  };

  if (initializing) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', maxWidth: '1100px', margin: '0 auto', padding: '20px', gap: '16px' }}>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 260 }} exit={{ opacity: 0, width: 0 }}
            style={{ overflow: 'hidden', flexShrink: 0 }}
          >
            <div style={{ width: 260, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '14px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => startNewConversation(workspaceId)}
                style={{ padding: '10px', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 600, cursor: 'pointer', marginBottom: '12px', fontSize: '14px' }}
              >+ New Chat</motion.button>

              <div style={{ overflowY: 'auto', flex: 1 }}>
                {conversations.length === 0 && <p style={{ color: '#6b6b85', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>No conversations yet</p>}
                {conversations.map((conv) => (
                  <motion.div key={conv._id} whileHover={{ x: 3 }} onClick={() => openConversation(conv)}
                    style={{
                      padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px',
                      background: conversationId === conv._id ? 'rgba(168,85,247,0.15)' : 'transparent',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <span style={{ fontSize: '13px', color: conversationId === conv._id ? '#fff' : '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.title || 'New Conversation'}
                    </span>
                    <span onClick={(e) => handleDeleteConversation(e, conv._id)} style={{ fontSize: '12px', opacity: 0.5, cursor: 'pointer', flexShrink: 0 }}>✕</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px' }}>☰</button>
            <h2 style={{ margin: 0, background: 'linear-gradient(135deg, #a855f7, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🧠 Company Brain</h2>
          </div>
          <a href="/dashboard" style={{ color: '#9ca3af', fontSize: '14px', textDecoration: 'none' }}>← Dashboard</a>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '20px', marginBottom: '16px', minHeight: '55vh', maxHeight: '65vh' }}>
          {messages.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '40px' }}>👋 Ask me anything about your company's documents.</p>}

          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '16px' }}>
                <div style={{ maxWidth: '75%', padding: '12px 16px', borderRadius: '14px', background: msg.sender === 'user' ? 'linear-gradient(135deg, #a855f7, #3b82f6)' : 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '15px', lineHeight: '1.5' }}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  {msg.citedDocuments && msg.citedDocuments.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {msg.citedDocuments.map((doc, i) => (
                        <span key={i} style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c4b5fd' }}>📄 {doc.documentName}</span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {sending && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '12px 16px', borderRadius: '14px', background: 'rgba(255,255,255,0.07)', color: '#9ca3af', fontSize: '14px' }}>Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
          <input type="text" placeholder="Ask about your documents..." value={input} onChange={(e) => setInput(e.target.value)} disabled={sending}
            style={{ flex: 1, padding: '14px 18px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none' }} />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" disabled={sending || !input.trim()}
            style={{ padding: '14px 24px', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: sending || !input.trim() ? 0.6 : 1 }}
          >Send</motion.button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
