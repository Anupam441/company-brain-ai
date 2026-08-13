import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
const NAV_ITEMS = [
  { path: '/dashboard', label: 'Documents', icon: '📄' },
  { path: '/chat', label: 'Chat', icon: '💬' },
  { path: '/team', label: 'Team', icon: '👥' },
  { path: '/analytics', label: 'Analytics', icon: '📊', adminOnly: true },
  { path: '/activity', label: 'Activity', icon: '🕓', adminOnly: true },
];
function SidebarLayout({ children, workspace, theme }) {
  const { user, logout } = useAuth();
  const { mode, toggleMode, t } = useAppTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = workspace?.role === 'admin';
  const accent = theme?.color || '#a855f7';
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <motion.div
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
        style={{
          width: '240px', minHeight: '100vh', padding: '24px 16px',
          background: t.sidebarBg, backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${t.panelBorder}`,
          display: 'flex', flexDirection: 'column', position: 'sticky', top: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px', marginBottom: '24px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px',
            background: `linear-gradient(135deg, ${accent}, #3b82f6)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px'
          }}>🧠</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: t.text, lineHeight: 1.2 }}>Company Brain</div>
            <div style={{ fontSize: '11px', color: t.textMuted }}>{workspace?.name || '—'}</div>
          </div>
        </div>
        <motion.button
          whileHover={{ background: t.hoverBg }}
          onClick={toggleMode}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 12px', borderRadius: '9px', border: `1px solid ${t.panelBorder}`,
            background: 'transparent', color: t.textMuted, fontSize: '12.5px', cursor: 'pointer', marginBottom: '20px'
          }}
        >
          <span>{mode === 'dark' ? '🌙 Dark mode' : '☀️ Light mode'}</span>
          <span style={{
            width: '30px', height: '16px', borderRadius: '10px', background: accent,
            position: 'relative', display: 'inline-block', opacity: 0.85
          }}>
            <span style={{
              position: 'absolute', top: '2px', left: mode === 'dark' ? '16px' : '2px',
              width: '12px', height: '12px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s'
            }} />
          </span>
        </motion.button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
            const active = location.pathname === item.path;
            return (
              <motion.div
                key={item.path}
                whileHover={{ x: 3 }}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '11px',
                  padding: '10px 12px', borderRadius: '9px', cursor: 'pointer',
                  background: active ? `${accent}22` : 'transparent',
                  border: active ? `1px solid ${accent}55` : '1px solid transparent',
                  color: active ? t.text : t.textMuted,
                  fontSize: '13.5px', fontWeight: active ? 600 : 500,
                  transition: 'background 0.15s'
                }}
              >
                <span style={{ fontSize: '15px' }}>{item.icon}</span>
                {item.label}
              </motion.div>
            );
          })}
        </div>
        <div style={{ borderTop: `1px solid ${t.panelBorder}`, paddingTop: '14px', marginTop: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', marginBottom: '10px' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: `linear-gradient(135deg, ${accent}, #3b82f6)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: '#fff'
            }}>{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: t.text, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name}</div>
              <div style={{ fontSize: '10.5px', color: t.textMuted, textTransform: 'capitalize' }}>{workspace?.role} · {workspace?.department}</div>
            </div>
          </div>
          <motion.button
            whileHover={{ background: t.hoverBg }}
            onClick={logout}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${t.panelBorder}`,
              background: 'transparent', color: t.textMuted, fontSize: '12.5px', cursor: 'pointer', textAlign: 'left'
            }}
          >⏻  Logout</motion.button>
        </div>
      </motion.div>
      <div style={{ flex: 1, minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  );
}
export default SidebarLayout;
