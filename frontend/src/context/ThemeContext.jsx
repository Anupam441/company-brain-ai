import { createContext, useContext, useState, useEffect } from 'react';
const ThemeContext = createContext();
export const THEMES = {
  dark: {
    mode: 'dark',
    bg: '#020207',
    panelBg: 'rgba(255,255,255,0.03)',
    panelBorder: 'rgba(255,255,255,0.07)',
    sidebarBg: 'rgba(10, 10, 20, 0.55)',
    text: '#ffffff',
    textMuted: '#8b8ba3',
    textFaint: '#6b6b85',
    inputBg: 'rgba(255,255,255,0.04)',
    inputBorder: 'rgba(255,255,255,0.12)',
    hoverBg: 'rgba(255,255,255,0.04)',
  },
  light: {
    mode: 'light',
    bg: '#f4f4f8',
    panelBg: 'rgba(255,255,255,0.75)',
    panelBorder: 'rgba(15,15,30,0.08)',
    sidebarBg: 'rgba(255, 255, 255, 0.75)',
    text: '#15151f',
    textMuted: '#5c5c72',
    textFaint: '#8a8a9c',
    inputBg: 'rgba(15,15,30,0.04)',
    inputBorder: 'rgba(15,15,30,0.12)',
    hoverBg: 'rgba(15,15,30,0.04)',
  }
};
export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'dark');
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    document.body.style.background = THEMES[mode].bg;
    document.body.style.color = THEMES[mode].text;
  }, [mode]);
  const toggleMode = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));
  return (
    <ThemeContext.Provider value={{ mode, toggleMode, t: THEMES[mode] }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useAppTheme() {
  return useContext(ThemeContext);
}
