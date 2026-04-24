import type { Question, ChatMessage } from '@/shared/types';

export interface PromptContext {
  question: Question;
  history: ChatMessage[];
  userMessage: string;
}

export interface AIProvider {
  streamResponse(context: PromptContext): AsyncIterable<string>;
}
