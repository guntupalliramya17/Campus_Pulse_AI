// Formatting and display utilities

export function formatScore(score: number | null): string {
  if (score == null) return 'N/A';
  return score.toFixed(1);
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return '—';
  }
}

export function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}` +
      ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  try {
    const target = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  } catch {
    return null;
  }
}

export function isOverdue(dateStr: string | null): boolean {
  const days = daysUntil(dateStr);
  return days != null && days < 0;
}

export function getScoreColor(score: number | null): string {
  if (score == null) return 'text-midnight-400';
  if (score >= 75) return 'text-teal-400';
  if (score >= 60) return 'text-warning';
  if (score >= 45) return 'text-orange-400';
  return 'text-danger';
}

export function getScoreBarColor(score: number | null): 'teal' | 'warning' | 'danger' | 'info' {
  if (score == null) return 'info';
  if (score >= 75) return 'teal';
  if (score >= 60) return 'warning';
  return 'danger';
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

export function generateId(prefix = ''): string {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
