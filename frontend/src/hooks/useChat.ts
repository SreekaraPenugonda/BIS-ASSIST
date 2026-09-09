import { useCallback, useRef, useState } from "react";
import { streamChat, type ChatMessageLocal } from "@/services/chatApi";
import { getErrorMessage } from "@/services/api";
import { useUserMode } from "@/context/UserModeContext";
import type { Language } from "@/types/api";

export interface UseChatState {
  messages: ChatMessageLocal[];
  streaming: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
  reset: () => void;
}

export function useChat(): UseChatState {
  const { addActivity, language } = useUserMode();
  const [messages, setMessages] = useState<ChatMessageLocal[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationId = useRef<number | null>(null);
  const languageRef = useRef<Language>(language);
  languageRef.current = language;

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;
      setError(null);

      const userMsg: ChatMessageLocal = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      const assistantMsg: ChatMessageLocal = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: "",
        streaming: true,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setStreaming(true);

      try {
        await streamChat(
          { message: trimmed, language: languageRef.current, conversation_id: conversationId.current },
          {
            onToken: (chunk) =>
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: m.content + chunk } : m))
              ),
            onMeta: (meta) =>
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? {
                        ...m,
                        streaming: false,
                        meta: {
                          status: meta.status,
                          confidence: meta.confidence,
                          mode: meta.mode === "ai" ? "ai" : "simulation",
                          standards: meta.standards,
                          sources: meta.sources,
                          disclaimer: meta.disclaimer,
                          intent: meta.intent,
                        },
                      }
                    : m
                )
              ),
            onDone: () => setStreaming(false),
          }
        );
        addActivity({
          title: trimmed.slice(0, 56),
          detail: "Asked the AI assistant",
          kind: "chat",
          status: "Answered",
        });
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsg.id ? { ...m, streaming: false } : m))
        );
        setError(getErrorMessage(err));
      } finally {
        setStreaming(false);
      }
    },
    [streaming, addActivity]
  );

  const reset = useCallback(() => {
    conversationId.current = null;
    setMessages([]);
    setError(null);
  }, []);

  return { messages, streaming, error, send, reset };
}