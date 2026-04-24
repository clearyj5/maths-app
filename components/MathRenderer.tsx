'use client';

import { Fragment, type ReactNode } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import { splitMath } from '@/lib/math';

interface MathRendererProps {
  children: string;
  className?: string;
}

function TextWithBold({ value }: { value: string }): ReactNode {
  // Handle `**bold**` as a lightweight extension so we don't need a full
  // markdown renderer. Everything else renders as plain text with line
  // breaks preserved via CSS.
  const parts = value.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

function renderFallback(source: string, err: Error): ReactNode {
  return (
    <code className="rounded bg-red-100 px-1 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
      {source} <span className="opacity-60">({err.name})</span>
    </code>
  );
}

export function MathRenderer({ children, className }: MathRendererProps): ReactNode {
  const segments = splitMath(children);

  return (
    // Root is a <span> (with display: block) rather than <div> so the component
    // is valid HTML even when nested inside a <p>. A real <div> inside a <p>
    // triggers a React hydration mismatch because browsers auto-close the <p>.
    <span className={className} style={{ whiteSpace: 'pre-wrap', display: 'block' }}>
      {segments.map((segment, i) => {
        switch (segment.kind) {
          case 'text':
            return (
              <Fragment key={i}>
                <TextWithBold value={segment.value} />
              </Fragment>
            );
          case 'inline':
            return (
              <InlineMath
                key={i}
                math={segment.value}
                renderError={(err) => renderFallback(`$${segment.value}$`, err)}
              />
            );
          case 'block':
            return (
              <BlockMath
                key={i}
                math={segment.value}
                renderError={(err) => renderFallback(`$$${segment.value}$$`, err)}
              />
            );
        }
      })}
    </span>
  );
}
