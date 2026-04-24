import Link from 'next/link';
import { ArrowRight, GraduationCap, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const LEVELS = [
  {
    slug: 'higher',
    label: 'Higher Level',
    description: 'Advanced topics including related rates, De Moivre, and non-trivial integration.',
    Icon: GraduationCap,
    accent: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    slug: 'ordinary',
    label: 'Ordinary Level',
    description:
      'Core Leaving Certificate material: foundational calculus, algebra, and trigonometry.',
    Icon: BookOpen,
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
] as const;

export function LevelChooser() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {LEVELS.map(({ slug, label, description, Icon, accent }) => (
        <Link key={slug} href={`/${slug}`} className="block focus-visible:outline-none">
          <Card interactive className="h-full">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-3">
                <Icon className={`h-8 w-8 ${accent}`} aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-semibold">{label}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
                </div>
              </div>
              <ArrowRight
                className="mt-2 h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
