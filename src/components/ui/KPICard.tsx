import type { ReactNode } from 'react';
import { Card } from './Card';
import { cn } from '@/utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: 'teal' | 'violet' | 'warning' | 'danger' | 'info';
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' };
  subtitle?: string;
  onClick?: () => void;
}

export function KPICard({ label, value, icon, color = 'teal', trend, subtitle, onClick }: KPICardProps) {
  const colorMap: Record<string, { iconBg: string; iconText: string; ring: string }> = {
    teal: { iconBg: 'bg-teal-500/15', iconText: 'text-teal-400', ring: 'hover:border-teal-500/40' },
    violet: { iconBg: 'bg-violet-400/15', iconText: 'text-violet-400', ring: 'hover:border-violet-400/40' },
    warning: { iconBg: 'bg-warning/15', iconText: 'text-warning', ring: 'hover:border-warning/40' },
    danger: { iconBg: 'bg-danger/15', iconText: 'text-danger', ring: 'hover:border-danger/40' },
    info: { iconBg: 'bg-info/15', iconText: 'text-info', ring: 'hover:border-info/40' },
  };
  const c = colorMap[color];

  return (
    <Card
      onClick={onClick}
      hover={!!onClick}
      className={cn('p-4 transition-all', onClick && c.ring)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-midnight-300 uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-2xl font-bold text-midnight-50">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-midnight-400">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.direction === 'up' && <TrendingUp className="w-3.5 h-3.5 text-teal-400" />}
              {trend.direction === 'down' && <TrendingDown className="w-3.5 h-3.5 text-danger" />}
              {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5 text-midnight-400" />}
              <span className={cn(
                'text-xs font-medium',
                trend.direction === 'up' ? 'text-teal-400' : trend.direction === 'down' ? 'text-danger' : 'text-midnight-400'
              )}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className={cn('rounded-lg p-2.5', c.iconBg, c.iconText)}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
