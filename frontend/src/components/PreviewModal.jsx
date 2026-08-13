import { AnimatePresence, motion } from 'framer-motion';
import { useAppTheme } from '../context/ThemeContext';
function PreviewModal({ open, loading, data, onClose, accentColor }) {
  const { t } = useAppTheme();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998, padding: '20px'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: t.mode === 'dark' ? '#14141f' : '#ffffff', border: `1px solid ${t.panelBorder}`, borderRadius: '16px',
              padding: '0', width: '600px', maxWidth: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${t.panelBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '15.5px', color: t.text, fontWeight: 700 }}>
                  {loading ? 'Loading…' : data?.document?.originalName}
                </h3>
                {data?.document && (
                  <div style={{ fontSize: '11.5px', color: t.textFaint }}>
                    {data.document.visibility === 'restricted' ? `🔒 Restricted · ${data.document.allowedDepartments?.join(', ')}` : '🌐 Visible to everyone'}
                    {' · '}
                    {new Date(data.document.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: t.textMuted, fontSize: '18px', cursor: 'pointer', padding: '2px 6px' }}>✕</button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {loading && (
                <div style={{ color: t.textMuted, fontSize: '13px' }}>Loading preview…</div>
              )}
              {!loading && data?.contentPreview && (
                <>
                  <div style={{ fontSize: '13.5px', color: t.text, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {data.contentPreview}
                  </div>
                  {data.truncated && (
                    <div style={{ marginTop: '14px', fontSize: '11.5px', color: t.textFaint, fontStyle: 'italic' }}>
                      Preview truncated — showing first portion of the document.
                    </div>
                  )}
                </>
              )}
              {!loading && !data?.contentPreview && (
                <div style={{ color: t.textFaint, fontSize: '13px', textAlign: 'center', padding: '30px 0' }}>
                  {data?.document?.status === 'processing'
                    ? 'Still processing — preview will be available shortly.'
                    : 'No preview content available.'}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export default PreviewModal;
