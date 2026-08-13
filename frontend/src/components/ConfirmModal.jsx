import { AnimatePresence, motion } from 'framer-motion';

function ConfirmModal({ open, title, message, onConfirm, onCancel, danger = true }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onCancel}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#14141f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
              padding: '26px', width: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', color: '#fff', fontWeight: 700 }}>{title}</h3>
            <p style={{ margin: '0 0 22px', fontSize: '13.5px', color: '#9898b3', lineHeight: '1.5' }}>{message}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={onCancel} style={{
                padding: '9px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent', color: '#c8c8d8', fontSize: '13px', cursor: 'pointer'
              }}>Cancel</button>
              <button onClick={onConfirm} style={{
                padding: '9px 16px', borderRadius: '8px', border: 'none',
                background: danger ? '#dc2626' : '#a855f7', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
              }}>{danger ? 'Delete' : 'Confirm'}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmModal;
