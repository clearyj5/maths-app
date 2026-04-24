import { TOPIC_LABELS } from '@/repositories/question-repository';
import type { Question } from '@/shared/types';
import type { AIProvider, PromptContext } from './ai-provider';

const CHUNK_DELAY_MS = 30;

type Intent = 'hint' | 'solution' | 'generic';

function detectIntent(message: string): Intent {
  const lower = message.toLowerCase();
  if (/\bhint\b/.test(lower) || /\bstuck\b/.test(lower) || /where do i start/.test(lower)) {
    return 'hint';
  }
  if (/\bsolution\b/.test(lower) || /\banswer\b/.test(lower) || /walk me through/.test(lower)) {
    return 'solution';
  }
  return 'generic';
}

function hintResponse(question: Question): string {
  const firstStep = question.solutionSteps[0];
  return [
    "Here's a gentle nudge to get you started — I won't give the whole answer away.",
    '',
    `**${firstStep.step}**`,
    '',
    firstStep.explanation,
    '',
    'Try the next step yourself and let me know what you get.',
  ].join('\n');
}

function solutionResponse(question: Question): string {
  const lines: string[] = ["Let's walk through this step by step.", ''];

  question.solutionSteps.forEach((step, index) => {
    lines.push(`**Step ${index + 1}: ${step.step}**`);
    lines.push('');
    lines.push(step.explanation);
    lines.push('');
  });

  lines.push(
    'That should give you the complete solution. Let me know if any step needs more unpacking.',
  );
  return lines.join('\n');
}

function genericResponse(question: Question): string {
  const topicLabel = TOPIC_LABELS[question.topic];
  const subtopicLabel = question.subtopic.replace(/-/g, ' ');

  return [
    'Good question — let me guide you rather than solve it outright.',
    '',
    `This problem sits in **${topicLabel}**, specifically around *${subtopicLabel}*. A good starting move is to identify what's given and what's being asked.`,
    '',
    'What formula or technique do you think applies here? If you tell me your first step, I can tell you whether it looks right.',
    '',
    "Or, if you'd prefer, ask me for a hint and I'll point you toward the opening move.",
  ].join('\n');
}

function pickResponse(context: PromptContext): string {
  const intent = detectIntent(context.userMessage);

  switch (intent) {
    case 'hint':
      return hintResponse(context.question);
    case 'solution':
      return solutionResponse(context.question);
    case 'generic':
      return genericResponse(context.question);
  }
}

async function* streamWords(text: string, delayMs: number): AsyncIterable<string> {
  const chunks = text.split(/(\s+)/).filter((chunk) => chunk.length > 0);
  for (const chunk of chunks) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    yield chunk;
  }
}

export class MockProvider implements AIProvider {
  constructor(private readonly delayMs: number = CHUNK_DELAY_MS) {}

  async *streamResponse(context: PromptContext): AsyncIterable<string> {
    const response = pickResponse(context);
    yield* streamWords(response, this.delayMs);
  }
}
