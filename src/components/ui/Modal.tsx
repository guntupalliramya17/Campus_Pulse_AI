import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!open) return null;

  const sizes: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-midnight-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative w-full max-h-[90vh] overflow-hidden rounded-xl border border-midnight-700 bg-midnight-900 shadow-2xl animate-slide-up flex flex-col',
        sizes[size]
      )}>
        <div className="flex items-center justify-between border-b border-midnight-700 px-5 py-3">
          <h2 className="text-base font-semibold text-midnight-50">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-midnight-400 transition-colors hover:bg-midnight-700/50 hover:text-midnight-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="border-t border-midnight-700 px-5 py-3 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
