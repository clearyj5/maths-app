import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MathRenderer } from '@/components/MathRenderer';
import type { Level, QuestionSummary } from '@/shared/types';

interface QuestionListProps {
  level: Level;
  questions: QuestionSummary[];
}

function prettifySubtopic(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function questionPreview(text: string, maxLen = 140): string {
  const firstBlock = text.split('\n')[0].split('$$')[0].trim();
  if (firstBlock.length <= maxLen) return firstBlock;
  const truncated = firstBlock.slice(0, maxLen).trim();
  // Drop a trailing orphan '$' (truncated mid-inline-math)
  const dollarCount = (truncated.match(/\$/g) ?? []).length;
  const safe = dollarCount % 2 === 0 ? truncated : truncated.slice(0, truncated.lastIndexOf('$'));
  return `${safe.trim()}…`;
}

export function QuestionList({ level, questions }: QuestionListProps) {
  if (questions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
        <p className="text-slate-600 dark:text-slate-400">
          No questions match the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {questions.map((question) => (
        <Link
          key={question.questionId}
          href={`/${level}/questions/${question.questionId}`}
          className="block focus-visible:outline-none"
        >
          <Card interactive>
            <CardHeader>
              <CardTitle>{prettifySubtopic(question.subtopic)}</CardTitle>
              <Badge variant="year">{question.year}</Badge>
            </CardHeader>
            <CardDescription className="text-base text-slate-700 dark:text-slate-300">
              <MathRenderer>{questionPreview(question.questionText)}</MathRenderer>
            </CardDescription>
          </Card>
        </Link>
      ))}
    </div>
  );
}
