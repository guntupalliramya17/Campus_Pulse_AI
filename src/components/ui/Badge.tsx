import { cn } from '@/utils/cn';
import type { RiskCategory, InterventionStatus } from '@/types';

// ============================================================
// Risk Badge
// ============================================================

const RISK_STYLES: Record<RiskCategory, { bg: string; text: string; border: string; label: string }> = {
  low: { bg: 'bg-teal-500/15', text: 'text-teal-300', border: 'border-teal-500/30', label: 'Low Risk' },
  moderate: { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/30', label: 'Moderate' },
  high: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', label: 'High Risk' },
  critical: { bg: 'bg-danger/15', text: 'text-danger', border: 'border-danger/30', label: 'Critical' },
  'insufficient-data': { bg: 'bg-midnight-500/20', text: 'text-midnight-300', border: 'border-midnight-500/30', label: 'Insufficient Data' },
};

export function RiskBadge({ category, size = 'md' }: { category: RiskCategory; size?: 'sm' | 'md' }) {
  const style = RISK_STYLES[category];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        style.bg,
        style.text,
        style.border,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      {style.label}
    </span>
  );
}

// ============================================================
// Status Badge (for interventions)
// ============================================================

const STATUS_STYLES: Record<InterventionStatus, { bg: string; text: string; border: string; label: string }> = {
  recommended: { bg: 'bg-info/15', text: 'text-info', border: 'border-info/30', label: 'Recommended' },
  accepted: { bg: 'bg-teal-500/15', text: 'text-teal-300', border: 'border-teal-500/30', label: 'Accepted' },
  'in-progress': { bg: 'bg-violet-400/15', text: 'text-violet-300', border: 'border-violet-400/30', label: 'In Progress' },
  completed: { bg: 'bg-success/15', text: 'text-success', border: 'border-success/30', label: 'Completed' },
  'on-hold': { bg: 'bg-warning/15', text: 'text-warning', border: 'border-warning/30', label: 'On Hold' },
  declined: { bg: 'bg-danger/15', text: 'text-danger', border: 'border-danger/30', label: 'Declined' },
};

export function StatusBadge({ status, size = 'md' }: { status: InterventionStatus; size?: 'sm' | 'md' }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        style.bg,
        style.text,
        style.border,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      {style.label}
    </span>
  );
}

// ============================================================
// Generic Badge
// ============================================================

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'teal' | 'violet' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  const styles: Record<string, string> = {
    default: 'bg-midnight-700/50 text-midnight-200 border-midnight-600/40',
    teal: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    violet: 'bg-violet-400/15 text-violet-300 border-violet-400/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    danger: 'bg-danger/15 text-danger border-danger/30',
    info: 'bg-info/15 text-info border-info/30',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        styles[variant],
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      {children}
    </span>
  );
}
