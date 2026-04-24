import type { ReactNode } from 'react';
import { clsx } from 'clsx';

type Variant = 'default' | 'higher' | 'ordinary' | 'year' | 'subtle';

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  default: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
  higher: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200',
  ordinary: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  year: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  subtle: 'bg-transparent text-slate-600 dark:text-slate-400',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
