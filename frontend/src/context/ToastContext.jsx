import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '10px', width: '320px'
      }}>
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              onClick={() => dismissToast(t.id)}
              style={{
                padding: '13px 16px', borderRadius: '11px', cursor: 'pointer',
                background: 'rgba(15, 15, 26, 0.92)', backdropFilter: 'blur(16px)',
                border: `1px solid ${toneColor(t.type)}44`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                display: 'flex', alignItems: 'flex-start', gap: '10px'
              }}
            >
              <span style={{ fontSize: '15px', marginTop: '1px' }}>{toneIcon(t.type)}</span>
              <span style={{ fontSize: '13px', color: '#fff', lineHeight: '1.4' }}>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function toneColor(type) {
  if (type === 'success') return '#4ade80';
  if (type === 'error') return '#f87171';
  return '#a855f7';
}
function toneIcon(type) {
  if (type === 'success') return '✅';
  if (type === 'error') return '⚠️';
  return 'ℹ️';
}

export function useToast() {
  return useContext(ToastContext);
}
