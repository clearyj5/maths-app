import Link from 'next/link';
import { Calculator, Sigma, Variable, type LucideIcon } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Level, Topic, TopicSummary } from '@/shared/types';

interface TopicGridProps {
  level: Level;
  topics: TopicSummary[];
}

const TOPIC_ICONS: Record<Topic, LucideIcon> = {
  trigonometry: Sigma,
  calculus: Calculator,
  algebra: Variable,
};

const TOPIC_BLURBS: Record<Topic, string> = {
  trigonometry: 'Sine rule, cosine rule, identities, and modelling.',
  calculus: 'Differentiation, integration, limits, and related rates.',
  algebra: 'Quadratics, sequences, logs, and complex numbers.',
};

export function TopicGrid({ level, topics }: TopicGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => {
        const Icon = TOPIC_ICONS[topic.slug];
        return (
          <Link
            key={topic.slug}
            href={`/${level}/topics/${topic.slug}`}
            className="block focus-visible:outline-none"
          >
            <Card interactive className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className="h-6 w-6 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                  <CardTitle>{topic.label}</CardTitle>
                </div>
                <Badge>{topic.questionCount} questions</Badge>
              </CardHeader>
              <CardDescription>{TOPIC_BLURBS[topic.slug]}</CardDescription>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
