import { getAIProvider } from '@/providers';
import { getQuestionRepository } from '@/repositories';
import { ChatRequestSchema } from '@/schemas/chat';
import { LevelSchema } from '@/schemas/question';
import { errorResponse, log, parseOrError, randomRequestId } from '@/lib/api';
import { sanitiseUserMessage } from '@/lib/sanitise';
import { truncateHistory } from '@/lib/session';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ level: string; questionId: string }> },
): Promise<Response> {
  const requestId = randomRequestId();
  const started = Date.now();
  const route = '/api/[level]/chat/[questionId]';

  try {
    const resolved = await params;

    const levelResult = parseOrError(LevelSchema, resolved.level, 'Invalid level');
    if (!levelResult.ok) return levelResult.response;

    const questionId = resolved.questionId;
    if (!questionId) return errorResponse('Missing question id', 400);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const bodyResult = parseOrError(ChatRequestSchema, body, 'Invalid chat request');
    if (!bodyResult.ok) return bodyResult.response;

    const question = await getQuestionRepository().getQuestion(levelResult.data, questionId);
    if (!question) return errorResponse('Question not found', 404);

    const sanitisedMessage = sanitiseUserMessage(bodyResult.data.message);
    if (!sanitisedMessage) return errorResponse('Message empty after sanitisation', 400);

    const history = truncateHistory(bodyResult.data.history);

    const provider = getAIProvider();
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of provider.streamResponse({
            question,
            history,
            userMessage: sanitisedMessage,
          })) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
          log({
            route,
            requestId,
            level: levelResult.data,
            questionId,
            durationMs: Date.now() - started,
          });
        } catch (err) {
          log({
            severity: 'error',
            route,
            requestId,
            questionId,
            durationMs: Date.now() - started,
            error: String(err),
          });
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Request-Id': requestId,
      },
    });
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
