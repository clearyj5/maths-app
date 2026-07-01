import { create } from 'zustand';
import type { ChatMessage } from '@/shared/types';

export type ChatStatus = 'idle' | 'streaming' | 'error';

export interface QuestionChatState {
  messages: ChatMessage[];
  status: ChatStatus;
  error?: string;
}

export const EMPTY_CHAT: QuestionChatState = { messages: [], status: 'idle' };

interface ChatStore {
  byQuestionId: Record<string, QuestionChatState>;
  appendUser: (questionId: string, content: string) => void;
  startAssistant: (questionId: string) => void;
  appendAssistantChunk: (questionId: string, chunk: string) => void;
  finishAssistant: (questionId: string) => void;
  setError: (questionId: string, error: string) => void;
  clearError: (questionId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  byQuestionId: {},

  appendUser: (questionId, content) =>
    set((state) => {
      const current = state.byQuestionId[questionId] ?? EMPTY_CHAT;
      return {
        byQuestionId: {
          ...state.byQuestionId,
          [questionId]: {
            ...current,
            messages: [...current.messages, { role: 'user', content }],
            status: 'idle',
            error: undefined,
          },
        },
      };
    }),

  startAssistant: (questionId) =>
    set((state) => {
      const current = state.byQuestionId[questionId] ?? EMPTY_CHAT;
      return {
        byQuestionId: {
          ...state.byQuestionId,
          [questionId]: {
            ...current,
            messages: [...current.messages, { role: 'assistant', content: '' }],
            status: 'streaming',
            error: undefined,
          },
        },
      };
    }),

  appendAssistantChunk: (questionId, chunk) =>
    set((state) => {
      const current = state.byQuestionId[questionId];
      if (!current || current.messages.length === 0) return state;
      const last = current.messages[current.messages.length - 1];
      if (last.role !== 'assistant') return state;
      const messages = current.messages.slice(0, -1);
      messages.push({ ...last, content: last.content + chunk });
      return {
        byQuestionId: {
          ...state.byQuestionId,
          [questionId]: { ...current, messages },
        },
      };
    }),

  finishAssistant: (questionId) =>
    set((state) => {
      const current = state.byQuestionId[questionId];
      if (!current) return state;
      return {
        byQuestionId: {
          ...state.byQuestionId,
          [questionId]: { ...current, status: 'idle' },
        },
      };
    }),

  setError: (questionId, error) =>
    set((state) => {
      const current = state.byQuestionId[questionId];
      if (!current) return state;
      const last = current.messages[current.messages.length - 1];
      const messages =
        last && last.role === 'assistant' && last.content === ''
          ? current.messages.slice(0, -1)
          : current.messages;
      return {
        byQuestionId: {
          ...state.byQuestionId,
          [questionId]: { ...current, messages, status: 'error', error },
        },
      };
    }),

  clearError: (questionId) =>
    set((state) => {
      const current = state.byQuestionId[questionId];
      if (!current) return state;
      return {
        byQuestionId: {
          ...state.byQuestionId,
          [questionId]: { ...current, status: 'idle', error: undefined },
        },
      };
    }),
}));
