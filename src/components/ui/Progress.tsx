import { cn } from '@/utils/cn';

// ============================================================
// Progress Bar
// ============================================================

interface ProgressProps {
  value: number; // 0-100
  max?: number;
  className?: string;
  color?: 'teal' | 'violet' | 'warning' | 'danger' | 'info' | 'success';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Progress({ value, max = 100, className, color = 'teal', showLabel = false, size = 'md' }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const colorMap: Record<string, string> = {
    teal: 'bg-teal-500',
    violet: 'bg-violet-400',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    success: 'bg-success',
  };
  const heightMap: Record<string, string> = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };
  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full rounded-full bg-midnight-700/50 overflow-hidden', heightMap[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', colorMap[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-right text-xs text-midnight-300">{Math.round(pct)}%</div>
      )}
    </div>
  );
}

// ============================================================
// Score Ring — circular progress indicator
// ============================================================

interface ScoreRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: 'teal' | 'violet' | 'warning' | 'danger';
}

export function ScoreRing({ value, size = 80, strokeWidth = 6, label, sublabel, color = 'teal' }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));
  const offset = circumference - (pct / 100) * circumference;

  const colorMap: Record<string, string> = {
    teal: '#00b894',
    violet: '#a85bf0',
    warning: '#f0a020',
    danger: '#e23856',
  };

  const actualColor = value == null ? '#4d6fa0' : colorMap[color];

  return (
    <div className="relative inline-flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1f3556"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={actualColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-midnight-50">
          {value == null ? 'N/A' : Math.round(value)}
        </span>
        {label && <span className="text-[9px] text-midnight-300 mt-0.5">{label}</span>}
      </div>
      {sublabel && (
        <span className="mt-1 text-xs text-midnight-300">{sublabel}</span>
      )}
    </div>
  );
}
