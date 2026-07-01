import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 p-8">
      <div className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-72" />
      </div>
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="space-y-3 p-6">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800">
              <Skeleton className="m-3 h-7 w-40" />
              <Skeleton className="m-3 h-7 w-32" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
