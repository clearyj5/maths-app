import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-6 p-8">
      <p className="text-sm font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
        404
      </p>
      <h1 className="text-4xl font-bold tracking-tight">We couldn&apos;t find that page.</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400">
        The level or topic in the URL doesn&apos;t exist. Pick a level and start from there.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
    </main>
  );
}
