import { z } from 'zod';
import { getQuestionRepository } from '@/repositories';
import { LevelSchema, TopicSchema } from '@/schemas/question';
import { errorResponse, jsonResponse, log, parseOrError, randomRequestId } from '@/lib/api';

export const runtime = 'nodejs';

const YearSchema = z.coerce.number().int().min(2000).max(2100).optional();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ level: string; topic: string }> },
): Promise<Response> {
  const requestId = randomRequestId();
  const started = Date.now();
  const route = '/api/[level]/topics/[topic]/questions';

  try {
    const resolved = await params;

    const levelResult = parseOrError(LevelSchema, resolved.level, 'Invalid level');
    if (!levelResult.ok) return levelResult.response;

    const topicResult = parseOrError(TopicSchema, resolved.topic, 'Unknown topic');
    if (!topicResult.ok) return topicResult.response;

    const url = new URL(request.url);
    const yearRaw = url.searchParams.get('year');
    const yearResult = parseOrError(YearSchema, yearRaw ?? undefined, 'Invalid year');
    if (!yearResult.ok) return yearResult.response;

    const questions = await getQuestionRepository().getQuestionsByTopic(
      levelResult.data,
      topicResult.data,
      yearResult.data !== undefined ? { year: yearResult.data } : undefined,
    );

    log({
      route,
      requestId,
      level: levelResult.data,
      topic: topicResult.data,
      year: yearResult.data,
      count: questions.length,
      durationMs: Date.now() - started,
    });

    return jsonResponse({ questions });
  } catch (err) {
    log({
      severity: 'error',
      route,
      requestId,
      durationMs: Date.now() - started,
      error: String(err),
    });
    return errorResponse('Internal error', 500);
  }
}
