'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, RotateCcw, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MathRenderer } from '@/components/MathRenderer';
import { EMPTY_CHAT, useChatStore } from '@/store/chat';
import type { ChatMessage, Level } from '@/shared/types';

interface ChatPanelProps {
  level: Level;
  questionId: string;
}

const SCROLL_THRESHOLD_PX = 60;
const MAX_HISTORY = 20;
const HINT_PROMPT = 'Give me a hint';
const SOLUTION_PROMPT = 'Walk me through the solution';

function getOrCreateSessionId(questionId: string): string {
  if (typeof window === 'undefined') return '';
  const key = `chat-session-${questionId}`;
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  window.sessionStorage.setItem(key, fresh);
  return fresh;
}

export function ChatPanel({ level, questionId }: ChatPanelProps) {
  const chat = useChatStore((s) => s.byQuestionId[questionId]) ?? EMPTY_CHAT;

  const [input, setInput] = useState('');
  const [showScrollDown, setShowScrollDown] = useState(false);
  const sessionIdRef = useRef<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId(questionId);
  }, [questionId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < SCROLL_THRESHOLD_PX) {
      el.scrollTop = el.scrollHeight;
      setShowScrollDown(false);
    } else {
      setShowScrollDown(true);
    }
  }, [chat.messages, chat.status]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(distanceFromBottom >= SCROLL_THRESHOLD_PX);
  }

  function scrollToLatest() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setShowScrollDown(false);
  }

  async function streamFromServer(message: string, history: ChatMessage[]) {
    const store = useChatStore.getState();
    store.startAssistant(questionId);
    try {
      const res = await fetch(`/api/${level}/chat/${questionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          message,
          history,
        }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) useChatStore.getState().appendAssistantChunk(questionId, chunk);
      }
      useChatStore.getState().finishAssistant(questionId);
    } catch (err) {
      useChatStore
        .getState()
        .setError(questionId, err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  async function send(content: string) {
    const trimmed = content.trim();
    if (!trimmed) return;
    const current = useChatStore.getState().byQuestionId[questionId] ?? EMPTY_CHAT;
    if (current.status === 'streaming') return;

    const history = current.messages.slice(-MAX_HISTORY);
    useChatStore.getState().appendUser(questionId, trimmed);
    await streamFromServer(trimmed, history);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = input;
    setInput('');
    await send(content);
  }

  async function handleRetry() {
    const current = useChatStore.getState().byQuestionId[questionId] ?? EMPTY_CHAT;
    let lastUserIdx = -1;
    for (let i = current.messages.length - 1; i >= 0; i--) {
      if (current.messages[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx === -1) {
      useChatStore.getState().clearError(questionId);
      return;
    }
    const lastUserContent = current.messages[lastUserIdx].content;
    const history = current.messages.slice(0, lastUserIdx).slice(-MAX_HISTORY);
    useChatStore.getState().clearError(questionId);
    await streamFromServer(lastUserContent, history);
  }

  const isStreaming = chat.status === 'streaming';
  const lastMessage = chat.messages[chat.messages.length - 1];
  const showTypingIndicator =
    isStreaming && lastMessage?.role === 'assistant' && lastMessage.content === '';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => send(HINT_PROMPT)}
          disabled={isStreaming}
        >
          Give me a hint
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => send(SOLUTION_PROMPT)}
          disabled={isStreaming}
        >
          Walk me through the solution
        </Button>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="h-[280px] overflow-y-auto rounded-md border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-950/40"
        >
          {chat.messages.length === 0 && !showTypingIndicator ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
              Ask the AI tutor for a hint, or type a question of your own.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {chat.messages.map((message, i) => (
                <MessageBubble key={i} message={message} />
              ))}
              {showTypingIndicator && <TypingIndicator />}
            </div>
          )}
        </div>

        {showScrollDown && (
          <button
            type="button"
            onClick={scrollToLatest}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-md hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <ArrowDown className="h-3 w-3" />
            Latest
          </button>
        )}
      </div>

      {chat.status === 'error' && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <span>{chat.error ?? 'Something went wrong.'}</span>
          <Button type="button" size="sm" variant="outline" onClick={handleRetry}>
            <RotateCcw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && input) {
              e.preventDefault();
              setInput('');
            }
          }}
          placeholder="Ask about this question…"
          disabled={isStreaming}
          maxLength={2000}
          aria-label="Ask the AI tutor about this question"
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500"
        />
        <Button type="submit" size="md" disabled={isStreaming || !input.trim()}>
          <Send className="h-4 w-4" />
          Send
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
            : 'bg-white text-slate-800 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700'
        }`}
      >
        <MathRenderer>{message.content}</MathRenderer>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <div className="flex gap-1" aria-label="Tutor is typing">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
        </div>
      </div>
    </div>
  );
}
