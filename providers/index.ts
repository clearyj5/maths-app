import type { AIProvider } from './ai-provider';
import { MockProvider } from './mock';
import { BedrockProvider } from './bedrock';

let instance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (instance === null) {
    const name = process.env.AI_PROVIDER ?? 'mock';

    switch (name) {
      case 'mock':
        instance = new MockProvider();
        break;
      case 'bedrock':
        instance = new BedrockProvider();
        break;
      default:
        throw new Error(`Unknown AI_PROVIDER: ${name}`);
    }
  }
  return instance;
}

export type { AIProvider, PromptContext } from './ai-provider';
