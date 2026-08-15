export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '#4b4b63' };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: '#f87171' };
  if (score <= 3) return { score: 2, label: 'Fair', color: '#facc15' };
  if (score === 4) return { score: 3, label: 'Good', color: '#4ade80' };
  return { score: 4, label: 'Strong', color: '#22d3ee' };
}
