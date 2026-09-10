import { api, API_URL, getErrorMessage } from "@/services/api";
import type {
  AnalysisMeta,
  ChatResponse,
  Language,
  Source,
  StandardRef,
  StreamEvent,
  StructuredAnswer,
} from "@/types/api";

export interface ChatPayload {
  message: string;
  language: Language;
  conversation_id?: number | null;
}

export interface ChatStreamOptions {
  onToken: (chunk: string) => void;
  onMeta?: (meta: StructuredAnswer) => void;
  onDone?: () => void;
}

export async function sendChat(payload: ChatPayload): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>("/api/chat", payload);
  return data;
}

/** Consume the SSE token stream from /api/chat/stream via fetch (axios can't stream). */
export async function streamChat(
  payload: ChatPayload,
  options: ChatStreamOptions
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(localStorage.getItem("bis_token")
          ? { Authorization: `Bearer ${localStorage.getItem("bis_token")}` }
          : {}),
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(getErrorMessage(new Error("Cannot reach the AI server. Is the backend running?")));
  }
  if (!res.ok || !res.body) {
    throw new Error(`Server responded with ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let receivedEvent = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const raw = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 2);
        if (raw.startsWith("data: ")) {
          const json = raw.slice(6).trim();
          if (!json) {
            boundary = buffer.indexOf("\n\n");
            continue;
          }
          const event: StreamEvent = JSON.parse(json);
          receivedEvent = true;
          if (event.type === "token" && event.content) {
            options.onToken(event.content);
          } else if (event.type === "meta" && event.meta) {
            options.onMeta?.(event.meta);
          } else if (event.type === "done") {
            if (event.meta) options.onMeta?.(event.meta);
            options.onDone?.();
              } else if (event.type === "close") {
                options.onDone?.();
          }
        }
        boundary = buffer.indexOf("\n\n");
      }
    }
        if (buffer.trim().startsWith("data: ")) {
          const event: StreamEvent = JSON.parse(buffer.trim().slice(6).trim());
          receivedEvent = true;
          if (event.type === "meta" && event.meta) options.onMeta?.(event.meta);
          options.onDone?.();
        }
        if (!receivedEvent) {
          const fallback = await sendChat(payload);
          options.onToken(fallback.structured.answer);
          options.onMeta?.(fallback.structured);
          options.onDone?.();
        }
  } finally {
    reader.releaseLock();
  }
}

export interface ChatMessageLocal {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: AnalysisMeta | null;
  streaming?: boolean;
  createdAt: string;
}