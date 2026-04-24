import type { ChatMessage } from '@/shared/types';

export const MAX_TURNS = 10;

/**
 * Keep only the most recent N messages, preserving order. A "turn" here means
 * a single message (user or assistant); MAX_TURNS = 10 therefore covers
 * roughly 5 user + 5 assistant exchanges.
 */
export function truncateHistory(history: ChatMessage[], limit: number = MAX_TURNS): ChatMessage[] {
  if (history.length <= limit) return history;
  return history.slice(history.length - limit);
}
