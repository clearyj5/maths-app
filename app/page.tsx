import { LevelChooser } from '@/components/LevelChooser';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-10 p-8">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Leaving Certificate Maths
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Practice with a tutor that actually knows the question.
        </h1>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Every past-paper question comes with an AI tutor that has the marking scheme and solution
          steps in front of it. Ask for a hint, request a walkthrough, or chase a detail — grounded
          in the exact problem you&apos;re solving.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Choose your level</h2>
        <LevelChooser />
      </section>
    </main>
  );
}
