'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Select } from '@/components/ui/Select';

interface YearFilterProps {
  years: number[];
}

export function YearFilter({ years }: YearFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('year') ?? '';

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('year', value);
    } else {
      params.delete('year');
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Select
      label="Year"
      value={current}
      onChange={(event) => handleChange(event.target.value)}
      className="sm:w-48"
    >
      <option value="">All years</option>
      {years.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </Select>
  );
}
