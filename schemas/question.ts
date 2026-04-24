import { z } from 'zod';

export const LevelSchema = z.enum(['higher', 'ordinary']);

export const TopicSchema = z.enum(['trigonometry', 'calculus', 'algebra']);

export const SolutionStepSchema = z.object({
  step: z.string().min(1),
  explanation: z.string().min(1),
});

export const QuestionSchema = z.object({
  questionId: z.string().min(1),
  level: LevelSchema,
  topic: TopicSchema,
  subtopic: z.string().min(1),
  year: z.number().int().min(2000).max(2100),
  questionText: z.string().min(1),
  markingScheme: z.string().min(1),
  solutionSteps: z.array(SolutionStepSchema).min(1),
});

export const QuestionSummarySchema = QuestionSchema.omit({
  markingScheme: true,
  solutionSteps: true,
});

export const TopicSummarySchema = z.object({
  slug: TopicSchema,
  label: z.string().min(1),
  questionCount: z.number().int().nonnegative(),
});

export const QuestionFiltersSchema = z.object({
  year: z.number().int().optional(),
});
