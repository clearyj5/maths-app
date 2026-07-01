import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { QuestionCard } from '@/components/QuestionCard';
import { Badge } from '@/components/ui/Badge';
import { getQuestionRepository } from '@/repositories';
import { LevelSchema, TopicSchema } from '@/schemas/question';
import { TOPIC_LABELS } from '@/repositories/question-repository';

interface PageProps {
  params: Promise<{ level: string; topic: string }>;
}

const LEVEL_LABELS = {
  higher: 'Higher Level',
  ordinary: 'Ordinary Level',
} as const;

export default async function TopicQuestionsPage({ params }: PageProps) {
  const { level: levelParam, topic: topicParam } = await params;

  const levelResult = LevelSchema.safeParse(levelParam);
  if (!levelResult.success) notFound();
  const topicResult = TopicSchema.safeParse(topicParam);
  if (!topicResult.success) notFound();

  const level = levelResult.data;
  const topic = topicResult.data;

  const questions = await getQuestionRepository().getQuestionsByTopic(level, topic);

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-8">
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
          {questions.length} question{questions.length === 1 ? '' : 's'}, newest first.
        </p>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400">
            No questions are available for this topic yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question) => (
            <QuestionCard key={question.questionId} level={level} question={question} />
          ))}
        </div>
      )}
    </main>
  );
}
