'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown, FileText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ChatPanel } from '@/components/ChatPanel';
import { MathRenderer } from '@/components/MathRenderer';
import { MarkingSchemePanel } from '@/components/MarkingSchemePanel';
import type { Level, QuestionSummary } from '@/shared/types';

interface QuestionCardProps {
  level: Level;
  question: QuestionSummary;
}

type OpenPanel = 'marking' | 'ai' | null;

function prettifySubtopic(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function QuestionCard({ level, question }: QuestionCardProps) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);

  const togglePanel = (panel: 'marking' | 'ai') => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            {prettifySubtopic(question.subtopic)}
          </h2>
          <Badge variant="year">{question.year}</Badge>
        </div>
        <div className="text-base text-slate-800 dark:text-slate-200">
          <MathRenderer>{question.questionText}</MathRenderer>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800">
        <AccordionRow
          icon={<FileText className="h-4 w-4" aria-hidden />}
          label="Marking Scheme"
          isOpen={openPanel === 'marking'}
          onToggle={() => togglePanel('marking')}
        >
          <MarkingSchemePanel markingScheme={question.markingScheme} />
        </AccordionRow>
        <AccordionRow
          icon={<Sparkles className="h-4 w-4" aria-hidden />}
          label="AI Helper"
          isOpen={openPanel === 'ai'}
          onToggle={() => togglePanel('ai')}
        >
          <ChatPanel level={level} questionId={question.questionId} />
        </AccordionRow>
      </div>
    </article>
  );
}

interface AccordionRowProps {
  icon: ReactNode;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function AccordionRow({ icon, label, isOpen, onToggle, children }: AccordionRowProps) {
  return (
    <div className="border-b border-slate-200 last:border-b-0 dark:border-slate-800">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-2 px-6 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:text-slate-200 dark:hover:bg-slate-800/60"
      >
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {isOpen && <div className="accordion-reveal px-6 pb-5">{children}</div>}
    </div>
  );
}
