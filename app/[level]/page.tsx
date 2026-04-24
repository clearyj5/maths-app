import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { TopicGrid } from '@/components/TopicGrid';
import { Badge } from '@/components/ui/Badge';
import { getQuestionRepository } from '@/repositories';
import { LevelSchema } from '@/schemas/question';

interface PageProps {
  params: Promise<{ level: string }>;
}

const LEVEL_LABELS = {
  higher: 'Higher Level',
  ordinary: 'Ordinary Level',
} as const;

export default async function LevelPage({ params }: PageProps) {
  const { level: levelParam } = await params;
  const parsed = LevelSchema.safeParse(levelParam);
  if (!parsed.success) notFound();

  const level = parsed.data;
  const topics = await getQuestionRepository().getTopics(level);

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-8">
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to levels
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{LEVEL_LABELS[level]}</h1>
          <Badge variant={level}>{level === 'higher' ? 'Higher' : 'Ordinary'}</Badge>
        </div>
        <p className="text-slate-600 dark:text-slate-400">Pick a topic to see its question bank.</p>
      </div>

      {topics.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-400">
          No questions are available at this level yet.
        </p>
      ) : (
        <TopicGrid level={level} topics={topics} />
      )}
    </main>
  );
}
