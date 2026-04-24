import type { z } from 'zod';
import type {
  LevelSchema,
  TopicSchema,
  QuestionSchema,
  QuestionSummarySchema,
  SolutionStepSchema,
  TopicSummarySchema,
  QuestionFiltersSchema,
} from '@/schemas/question';
import type { ChatRoleSchema, ChatMessageSchema, ChatRequestSchema } from '@/schemas/chat';

export type Level = z.infer<typeof LevelSchema>;
export type Topic = z.infer<typeof TopicSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionSummary = z.infer<typeof QuestionSummarySchema>;
export type SolutionStep = z.infer<typeof SolutionStepSchema>;
export type TopicSummary = z.infer<typeof TopicSummarySchema>;
export type QuestionFilters = z.infer<typeof QuestionFiltersSchema>;

export type ChatRole = z.infer<typeof ChatRoleSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatRequest = z.infer<typeof ChatRequestSchema>;
