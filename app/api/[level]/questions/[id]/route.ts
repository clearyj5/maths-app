import { getQuestionRepository } from '@/repositories';
import { LevelSchema } from '@/schemas/question';
import { errorResponse, jsonResponse, log, parseOrError, randomRequestId } from '@/lib/api';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ level: string; id: string }> },
): Promise<Response> {
  const requestId = randomRequestId();
  const started = Date.now();
  const route = '/api/[level]/questions/[id]';

  try {
    const resolved = await params;

    const levelResult = parseOrError(LevelSchema, resolved.level, 'Invalid level');
    if (!levelResult.ok) return levelResult.response;

    const questionId = resolved.id;
    if (!questionId) return errorResponse('Missing question id', 400);

    const url = new URL(request.url);
    const includeSolution = url.searchParams.get('includeSolution') === 'true';

    const question = await getQuestionRepository().getQuestion(levelResult.data, questionId);
    if (!question) {
      log({
        severity: 'warn',
        route,
        requestId,
        questionId,
        reason: 'not found',
        durationMs: Date.now() - started,
      });
      return errorResponse('Question not found', 404);
    }

    const payload = includeSolution
      ? question
      : (() => {
          const { markingScheme: _ms, solutionSteps: _ss, ...rest } = question;
          return rest;
        })();

    log({
      route,
      requestId,
      level: levelResult.data,
      questionId,
      includeSolution,
      durationMs: Date.now() - started,
    });

    return jsonResponse({ question: payload });
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
