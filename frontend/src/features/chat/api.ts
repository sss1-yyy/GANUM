import { apiGet, apiPost } from "@/shared/api";
import type { ListData } from "@/shared/api";
import type { ChatContextType } from "@/shared/types";
import type { ChatMessage, ChatSession, SendMessageResult } from "./types";

// CHAT-01 · 화면 맥락 대화 생성
export const createChatSession = (contextType: ChatContextType, contextId: string | null) =>
  apiPost<ChatSession>("/chat/sessions", { contextType, contextId });

// CHAT-03 · 메시지 목록
export const listChatMessages = (sessionId: string) =>
  apiGet<ListData<ChatMessage>>(`/chat/sessions/${sessionId}/messages`);

// CHAT-04 · 질문 전송 (답변까지 한 번에 돌아오는 동기 방식)
export const sendChatMessage = (sessionId: string, content: string) =>
  apiPost<SendMessageResult>(`/chat/sessions/${sessionId}/messages`, { content });
