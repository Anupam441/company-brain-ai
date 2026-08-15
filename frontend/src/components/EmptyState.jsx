import { motion } from 'framer-motion';
import { useAppTheme } from '../context/ThemeContext';

function EmptyState({ icon = '📭', title, subtitle, action }) {
  const { t } = useAppTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', textAlign: 'center' }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        style={{ fontSize: '44px', marginBottom: '16px', opacity: 0.85 }}
      >{icon}</motion.div>
      <div style={{ fontSize: '14.5px', color: t.text, fontWeight: 600, marginBottom: '5px' }}>{title}</div>
      {subtitle && <div style={{ fontSize: '12.5px', color: t.textMuted, maxWidth: '280px', lineHeight: '1.5' }}>{subtitle}</div>}
      {action && <div style={{ marginTop: '18px' }}>{action}</div>}
    </motion.div>
  );
}

export default EmptyState;
