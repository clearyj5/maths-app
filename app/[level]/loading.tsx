import { Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 p-8">
      <div className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </main>
  );
}
