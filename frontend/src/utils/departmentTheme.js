const themes = {
  general:     { color: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)',  icon: '🌐', label: 'General' },
  hr:          { color: '#ec4899', glow: 'rgba(236, 72, 153, 0.4)',  icon: '🧑‍🤝‍🧑', label: 'HR' },
  engineering: { color: '#22d3ee', glow: 'rgba(34, 211, 238, 0.4)',  icon: '⚙️', label: 'Engineering' },
  sales:       { color: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)',   icon: '📈', label: 'Sales' },
  finance:     { color: '#eab308', glow: 'rgba(234, 179, 8, 0.4)',   icon: '💰', label: 'Finance' }
};
export function getDeptTheme(department) {
  return themes[department] || themes.general;
}
