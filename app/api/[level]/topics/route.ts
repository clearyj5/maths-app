import { getQuestionRepository } from '@/repositories';
import { LevelSchema } from '@/schemas/question';
import { errorResponse, jsonResponse, log, parseOrError, randomRequestId } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ level: string }> },
): Promise<Response> {
  const requestId = randomRequestId();
  const started = Date.now();
  const route = '/api/[level]/topics';

  try {
    const resolved = await params;

    const levelResult = parseOrError(LevelSchema, resolved.level, 'Invalid level');
    if (!levelResult.ok) return levelResult.response;

    const topics = await getQuestionRepository().getTopics(levelResult.data);

    log({
      route,
      requestId,
      level: levelResult.data,
      count: topics.length,
      durationMs: Date.now() - started,
    });
    return jsonResponse({ topics });
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
