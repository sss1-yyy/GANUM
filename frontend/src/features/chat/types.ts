import type { ChatContextType } from "@/shared/types";

// CHAT-01
export interface ChatSession {
  id: string;
  contextType: ChatContextType;
  contextId: string | null;
  title: string;
  suggestedQuestions: string[];
  createdAt: string;
}

// CHAT-03 / CHAT-04
export interface ChatSource {
  title: string;
  url: string | null;
  asOf: string | null;
}

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources: ChatSource[];
  createdAt: string;
}

export interface SendMessageResult {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  suggestedQuestions: string[];
  tokensCharged: number;
}
