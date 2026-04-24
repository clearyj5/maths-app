import type {
  Level,
  Topic,
  Question,
  QuestionSummary,
  TopicSummary,
  QuestionFilters,
} from '@/shared/types';

export interface QuestionRepository {
  getTopics(level: Level): Promise<TopicSummary[]>;
  getQuestionsByTopic(
    level: Level,
    topic: Topic,
    filters?: QuestionFilters,
  ): Promise<QuestionSummary[]>;
  getQuestion(level: Level, questionId: string): Promise<Question | null>;
}

export const TOPIC_LABELS: Record<Topic, string> = {
  trigonometry: 'Trigonometry',
  calculus: 'Calculus',
  algebra: 'Algebra',
};
