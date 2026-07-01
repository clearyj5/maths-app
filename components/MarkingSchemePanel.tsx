import { MathRenderer } from '@/components/MathRenderer';

interface MarkingSchemePanelProps {
  markingScheme: string;
}

export function MarkingSchemePanel({ markingScheme }: MarkingSchemePanelProps) {
  const parts = markingScheme.split('\n').filter((line) => line.trim().length > 0);

  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
      {parts.map((part, i) => (
        <MathRenderer key={i}>{part}</MathRenderer>
      ))}
    </div>
  );
}
