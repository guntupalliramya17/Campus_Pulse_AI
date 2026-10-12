import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  options: { value: string | number; label: string }[];
  className?: string;
  id?: string;
}

export function Select({ label, value, onChange, options, className, id }: SelectProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && <label htmlFor={id} className="text-xs font-medium text-midnight-300">{label}</label>}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-midnight-700 bg-midnight-800/60 px-3 py-2 pr-8 text-sm text-midnight-100 outline-none transition-colors hover:border-midnight-600 focus:border-teal-500"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-midnight-800 text-midnight-100">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-midnight-400" />
      </div>
    </div>
  );
}

interface TextInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'date';
  className?: string;
  id?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function TextInput({ label, value, onChange, placeholder, type = 'text', className, id, min, max, step }: TextInputProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && <label htmlFor={id} className="text-xs font-medium text-midnight-300">{label}</label>}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-lg border border-midnight-700 bg-midnight-800/60 px-3 py-2 text-sm text-midnight-100 outline-none transition-colors hover:border-midnight-600 focus:border-teal-500 placeholder:text-midnight-500"
      />
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  className?: string;
}

export function Slider({ label, value, onChange, min, max, step = 1, unit, className }: SliderProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-midnight-300">{label}</label>
        <span className="text-xs font-semibold text-teal-300">
          {value}{unit && ` ${unit}`}
        </span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 rounded-full appearance-none bg-midnight-700 accent-teal-500 cursor-pointer"
      />
    </div>
  );
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  icon?: ReactNode;
}

export function Button({ children, onClick, variant = 'primary', size = 'md', className, disabled, type = 'button', icon }: ButtonProps) {
  const variants: Record<string, string> = {
    primary: 'bg-teal-500 text-midnight-950 hover:bg-teal-400 font-medium shadow-lg shadow-teal-500/20',
    secondary: 'bg-violet-400/15 text-violet-300 border border-violet-400/30 hover:bg-violet-400/25',
    ghost: 'text-midnight-300 hover:text-midnight-100 hover:bg-midnight-700/40',
    danger: 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25',
    outline: 'border border-midnight-600 text-midnight-200 hover:border-midnight-500 hover:bg-midnight-700/30',
  };
  const sizes: Record<string, string> = {
    sm: 'px-2.5 py-1 text-xs rounded-md gap-1',
    md: 'px-4 py-2 text-sm rounded-lg gap-1.5',
    lg: 'px-5 py-2.5 text-base rounded-lg gap-2',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}
