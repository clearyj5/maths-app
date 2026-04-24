'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { Search } from 'lucide-react';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ label, className, id, ...rest }, ref) => {
    const inputId = id ?? `search-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-slate-600 dark:text-slate-400"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            id={inputId}
            ref={ref}
            type="search"
            className={clsx(
              'h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm',
              'text-slate-900 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
              'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500',
              className,
            )}
            {...rest}
          />
        </div>
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';
