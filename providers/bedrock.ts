import type { AIProvider, PromptContext } from './ai-provider';

export class BedrockProvider implements AIProvider {
  async *streamResponse(_context: PromptContext): AsyncIterable<string> {
    throw new Error(
      'BedrockProvider is not yet implemented. See PLAN.md "Future Phase — Bedrock Activation" before enabling AI_PROVIDER=bedrock.',
    );
    // Unreachable; satisfies generator signature.
    yield '';
  }
}
