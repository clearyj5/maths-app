import { z } from 'zod';
import { LevelSchema, TopicSchema } from '@/schemas/question';
import { log } from './log';

export function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  return Response.json(data, init);
}

export function errorResponse(message: string, status: number, details?: unknown): Response {
  return Response.json({ error: message, ...(details !== undefined && { details }) }, { status });
}

export function randomRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Parse a Zod schema, returning a 400 Response on failure. The returned tuple
 * lets the caller early-return without nested try/catch.
 */
export function parseOrError<T>(
  schema: z.ZodType<T>,
  input: unknown,
  message: string,
): { ok: true; data: T } | { ok: false; response: Response } {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    response: errorResponse(message, 400, result.error.issues),
  };
}

export { LevelSchema, TopicSchema };
export { log };
