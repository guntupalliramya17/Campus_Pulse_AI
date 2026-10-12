import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

// ============================================================
// Card — base container with dark theme
// ============================================================

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className, onClick, hover }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-midnight-700/60 bg-midnight-800/40 backdrop-blur-sm',
        hover && 'transition-all hover:border-midnight-600 hover:bg-midnight-800/60 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, icon, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between p-4 pb-2', className)}>
      <div className="flex items-center gap-2.5">
        {icon && <div className="text-teal-400">{icon}</div>}
        <div>
          <h3 className="text-sm font-semibold text-midnight-100">{title}</h3>
          {subtitle && <p className="text-xs text-midnight-300 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn('p-4 pt-2', className)}>{children}</div>;
}
