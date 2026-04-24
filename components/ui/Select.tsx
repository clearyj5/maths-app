'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className, id, children, ...rest }, ref) => {
    const selectId = id ?? `select-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-medium text-slate-600 dark:text-slate-400"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={clsx(
              'h-10 w-full appearance-none rounded-md border border-slate-300 bg-white px-3 pr-9 text-sm',
              'text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
              'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
              className,
            )}
            {...rest}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
        </div>
      </div>
    );
  },
);
Select.displayName = 'Select';
