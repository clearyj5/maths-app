import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { QuestionList } from '@/components/QuestionList';
import { YearFilter } from '@/components/YearFilter';
import { Badge } from '@/components/ui/Badge';
import { getQuestionRepository } from '@/repositories';
import { LevelSchema, TopicSchema } from '@/schemas/question';
import { TOPIC_LABELS } from '@/repositories/question-repository';

interface PageProps {
  params: Promise<{ level: string; topic: string }>;
  searchParams: Promise<{ year?: string }>;
}

const LEVEL_LABELS = {
  higher: 'Higher Level',
  ordinary: 'Ordinary Level',
} as const;

export default async function TopicQuestionsPage({ params, searchParams }: PageProps) {
  const [{ level: levelParam, topic: topicParam }, { year: yearParam }] = await Promise.all([
    params,
    searchParams,
  ]);

  const levelResult = LevelSchema.safeParse(levelParam);
  if (!levelResult.success) notFound();
  const topicResult = TopicSchema.safeParse(topicParam);
  if (!topicResult.success) notFound();

  const level = levelResult.data;
  const topic = topicResult.data;

  const repo = getQuestionRepository();
  const yearNumber = yearParam ? Number(yearParam) : undefined;
  const hasYearFilter = yearNumber !== undefined && !Number.isNaN(yearNumber);

  const [questions, allQuestions] = await Promise.all([
    repo.getQuestionsByTopic(level, topic, hasYearFilter ? { year: yearNumber } : undefined),
    repo.getQuestionsByTopic(level, topic),
  ]);

  const availableYears = Array.from(new Set(allQuestions.map((q) => q.year))).sort((a, b) => b - a);

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-8">
      <div className="space-y-4">
        <Link
          href={`/${level}`}
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to topics
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{TOPIC_LABELS[topic]}</h1>
          <Badge variant={level}>{LEVEL_LABELS[level]}</Badge>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          {allQuestions.length} question{allQuestions.length === 1 ? '' : 's'} in this topic.
        </p>
      </div>

      {availableYears.length > 1 && (
        <div className="flex flex-wrap gap-4">
          <YearFilter years={availableYears} />
        </div>
      )}

      <QuestionList level={level} questions={questions} />
    </main>
  );
}
