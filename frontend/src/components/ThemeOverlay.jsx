import { useAppTheme } from '../context/ThemeContext';
function ThemeOverlay() {
  const { t, mode } = useAppTheme();
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
      background: t.bg,
      opacity: mode === 'dark' ? 0.25 : 0.93,
      transition: 'opacity 0.3s ease, background 0.3s ease'
    }} />
  );
}
export default ThemeOverlay;
