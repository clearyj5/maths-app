import { LocalJsonRepository } from './local-json';
import type { QuestionRepository } from './question-repository';

let instance: QuestionRepository | null = null;

export function getQuestionRepository(): QuestionRepository {
  if (instance === null) {
    const source = process.env.DATA_SOURCE ?? 'local-json';

    switch (source) {
      case 'local-json':
        instance = new LocalJsonRepository();
        break;
      case 'dynamodb':
        throw new Error(
          'DynamoDBRepository is not yet implemented (see PLAN.md "Post-Demo: AWS Migration")',
        );
      default:
        throw new Error(`Unknown DATA_SOURCE: ${source}`);
    }
  }
  return instance;
}

export type { QuestionRepository } from './question-repository';
