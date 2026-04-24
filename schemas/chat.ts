import { z } from 'zod';

export const ChatRoleSchema = z.enum(['user', 'assistant']);

export const ChatMessageSchema = z.object({
  role: ChatRoleSchema,
  content: z.string().min(1),
});

export const ChatRequestSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(2000),
  history: z.array(ChatMessageSchema).max(20).default([]),
});
