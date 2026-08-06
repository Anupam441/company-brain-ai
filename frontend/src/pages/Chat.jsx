import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
function Chat() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  useEffect(() => { startConversation(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  const startConversation = async () => {
    try {
      const wsRes = await api.get('/workspaces');
      if (wsRes.data.workspaces.length === 0) { navigate('/dashboard'); return; }
      const workspaceId = wsRes.data.workspaces[0].id;
      const convRes = await api.post(`/workspaces/${workspaceId}/conversations`);
      setConversationId(convRes.data.conversation._id);
    } catch (err) { console.error(err); }
    finally { setInitializing(false); }
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
      setMessages((prev) => [...prev, { sender: 'ai', content: res.data.answer, citedDocuments: res.data.citedDocuments }]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'ai', content: 'Sorry, something went wrong. Please try again.', citedDocuments: [] }]);
    } finally { setSending(false); }
  };
  if (initializing) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', maxWidth: '750px', margin: '0 auto', padding: '20px' }}>
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, background: 'linear-gradient(135deg, #a855f7, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🧠 Company Brain</h2>
        <a href="/dashboard" style={{ color: '#9ca3af', fontSize: '14px', textDecoration: 'none' }}>← Dashboard</a>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ flex: 1, overflowY: 'auto', background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '20px', marginBottom: '16px', minHeight: '55vh', maxHeight: '65vh' }}
      >
        {messages.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '40px' }}>👋 Ask me anything about your company's documents.</p>}
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 15, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.35 }}
              style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '16px' }}
            >
              <div style={{ maxWidth: '75%', padding: '12px 16px', borderRadius: '14px', background: msg.sender === 'user' ? 'linear-gradient(135deg, #a855f7, #3b82f6)' : 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '15px', lineHeight: '1.5' }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                {msg.citedDocuments && msg.citedDocuments.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {msg.citedDocuments.map((doc, i) => (
                      <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.08 }}
                        style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.3)', color: '#c4b5fd' }}
                      >📄 {doc.documentName}</motion.span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {sending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ padding: '12px 16px', borderRadius: '14px', background: 'rgba(255,255,255,0.07)', color: '#9ca3af', fontSize: '14px' }}>Thinking...</motion.div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </motion.div>
      <motion.form initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
        <input type="text" placeholder="Ask about your documents..." value={input} onChange={(e) => setInput(e.target.value)} disabled={sending}
          style={{ flex: 1, padding: '14px 18px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none' }} />
        <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168,85,247,0.4)' }} whileTap={{ scale: 0.95 }} type="submit" disabled={sending || !input.trim()}
          style={{ padding: '14px 24px', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: sending || !input.trim() ? 0.6 : 1 }}
        >Send</motion.button>
      </motion.form>
    </motion.div>
  );
}
export default Chat;
