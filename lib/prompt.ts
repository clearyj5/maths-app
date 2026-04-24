import type { ChatMessage, Question } from '@/shared/types';

const SYSTEM_INSTRUCTIONS = `You are an expert Leaving Certificate Maths tutor. Guide students using the Socratic method — ask leading questions, provide hints, and explain reasoning. Do NOT give away full solutions unless explicitly asked.

You have access to the following context for this problem only. Do not answer questions outside this context.`;

const RULES = `Rules:
- Respond in structured steps when explaining a process
- For hints: give one step of guidance only, not the full solution
- For full solutions: walk through solution steps one at a time
- For unrelated questions: politely redirect the student
- Use LaTeX for all mathematical expressions (e.g. \\frac{1}{2}, \\sin\\theta)`;

function formatSolutionSteps(question: Question): string {
  return question.solutionSteps.map((s, i) => `${i + 1}. ${s.step} — ${s.explanation}`).join('\n');
}

function formatHistory(history: ChatMessage[]): string {
  if (history.length === 0) return '(no prior messages)';
  return history.map((m) => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');
}

export interface BuildPromptInput {
  question: Question;
  history: ChatMessage[];
  userMessage: string;
}

/**
 * Pure function that builds the single-string prompt used by the Bedrock
 * provider. Unused by MockProvider (which reads structured context directly).
 * Keeping this as a pure fn means the Bedrock provider stays small and
 * testable.
 */
export function buildPrompt({ question, history, userMessage }: BuildPromptInput): string {
  return [
    'System:',
    SYSTEM_INSTRUCTIONS,
    '',
    '--- QUESTION ---',
    question.questionText,
    '',
    '--- MARKING SCHEME ---',
    question.markingScheme,
    '',
    '--- SOLUTION STEPS ---',
    formatSolutionSteps(question),
    '---',
    '',
    RULES,
    '',
    'Conversation history:',
    formatHistory(history),
    '',
    `Student: ${userMessage}`,
    'Tutor:',
  ].join('\n');
}
