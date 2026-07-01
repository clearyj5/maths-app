import fs from 'node:fs';
import path from 'node:path';
import { QuestionSchema } from '@/schemas/question';
import type {
  Level,
  Topic,
  Question,
  QuestionSummary,
  TopicSummary,
  QuestionFilters,
} from '@/shared/types';
import { TOPIC_LABELS, type QuestionRepository } from './question-repository';

const DATA_ROOT = path.join(process.cwd(), 'data', 'questions');
const LEVELS: Level[] = ['higher', 'ordinary'];

function loadAllQuestions(): Question[] {
  const questions: Question[] = [];

  for (const level of LEVELS) {
    const levelDir = path.join(DATA_ROOT, level);
    if (!fs.existsSync(levelDir)) continue;

    for (const topicName of fs.readdirSync(levelDir)) {
      const topicDir = path.join(levelDir, topicName);
      if (!fs.statSync(topicDir).isDirectory()) continue;

      for (const file of fs.readdirSync(topicDir)) {
        if (!file.endsWith('.json')) continue;

        const raw = fs.readFileSync(path.join(topicDir, file), 'utf8');
        const parsed = QuestionSchema.parse(JSON.parse(raw));
        questions.push(parsed);
      }
    }
  }

  return questions;
}

function toSummary(question: Question): QuestionSummary {
  const { solutionSteps: _solutionSteps, ...summary } = question;
  return summary;
}

export class LocalJsonRepository implements QuestionRepository {
  private cache: Question[] | null = null;

  private all(): Question[] {
    if (this.cache === null) {
      this.cache = loadAllQuestions();
    }
    return this.cache;
  }

  async getTopics(level: Level): Promise<TopicSummary[]> {
    const counts = new Map<Topic, number>();

    for (const question of this.all()) {
      if (question.level !== level) continue;
      counts.set(question.topic, (counts.get(question.topic) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([slug, questionCount]) => ({
        slug,
        label: TOPIC_LABELS[slug],
        questionCount,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  async getQuestionsByTopic(
    level: Level,
    topic: Topic,
    filters?: QuestionFilters,
  ): Promise<QuestionSummary[]> {
    return this.all()
      .filter((q) => q.level === level && q.topic === topic)
      .filter((q) => filters?.year === undefined || q.year === filters.year)
      .sort((a, b) => b.year - a.year || a.questionId.localeCompare(b.questionId))
      .map(toSummary);
  }

  async getQuestion(level: Level, questionId: string): Promise<Question | null> {
    return this.all().find((q) => q.level === level && q.questionId === questionId) ?? null;
  }
}
