"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { USE_MOCK } from "@/shared/api";
import { isApiError } from "@/shared/api/error";
import type { ChatContextType } from "@/shared/types";
import { createChatSession, listChatMessages, sendChatMessage } from "../api";
import type { ChatMessage } from "../types";

/** 컨텍스트 카드의 "지금 보고 있는 ○○" 문구 */
const CONTEXT_LABELS: Record<ChatContextType, string> = {
  HOME: "홈",
  ASSET: "내 자산",
  BENEFIT: "혜택",
  REPORT: "레포트",
  INSTRUMENT: "종목",
  SIMULATION: "시뮬레이션 결과",
};

/** CHAT-04 오류 코드 → 사용자 안내 문구 (API 명세서) */
const SEND_ERROR_MESSAGES: Record<string, string> = {
  TOKEN_INSUFFICIENT: "이용권이 부족해서 답변을 만들 수 없어요.",
  AI_TIMEOUT: "답변 생성이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.",
};

/**
 * AI 금융 코치 시트 (CHAT-01 · 03 · 04).
 * 화면 맥락(contextType·contextId)으로 대화를 만들고, 질문을 동기 방식으로 주고받아요.
 * Figma: 393×680 시트, 위 모서리 24px, 패딩 상24·좌우32·하40.
 */
export function ChatSheet({
  contextType,
  contextId = null,
  onClose,
}: {
  contextType: ChatContextType;
  contextId?: string | null;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  /** 이번에 보낸 질문·답변 (CHAT-03 초기 목록 뒤에 이어 붙여요) */
  const [sent, setSent] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // CHAT-01 · 같은 맥락이면 세션을 다시 만들지 않고 캐시를 재사용해요
  const session = useQuery({
    queryKey: ["chat", "session", contextType, contextId],
    queryFn: () => createChatSession(contextType, contextId),
    staleTime: Infinity,
  });
  const sessionId = session.data?.data.id ?? null;

  // CHAT-03 · 지난 메시지 (이후 대화는 sent 로 이어 붙이므로 다시 불러오지 않아요)
  const history = useQuery({
    enabled: sessionId !== null,
    queryKey: ["chat", "messages", sessionId],
    queryFn: () => listChatMessages(sessionId ?? ""),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // CHAT-04 · 질문 전송 (답변까지 한 번에 돌아오는 동기 방식)
  const send = useMutation({
    mutationFn: (content: string) => sendChatMessage(sessionId ?? "", content),
    onSuccess: (response) => {
      setSent((prev) => [...prev, response.data.userMessage, response.data.assistantMessage]);
      setSuggestions(response.data.suggestedQuestions);
      setInput("");
    },
  });

  const historyItems = history.data?.data.items ?? [];
  // 혹시 같은 메시지가 양쪽에 있어도 한 번만 보여줘요
  const seen = new Set<string>();
  const messages = [...historyItems, ...sent].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  const chips = suggestions ?? session.data?.data.suggestedQuestions ?? [];

  // 새 메시지가 생기면 맨 아래로 스크롤
  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messages.length, send.isPending]);

  const submit = (text: string) => {
    const content = text.trim();
    if (content.length < 1 || content.length > 2000) return;
    if (sessionId === null || send.isPending) return;
    send.mutate(content);
  };

  const sendError =
    send.error !== null
      ? isApiError(send.error)
        ? (SEND_ERROR_MESSAGES[send.error.code] ?? send.error.message)
        : "질문을 보내지 못했어요. 잠시 후 다시 시도해 주세요."
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="bg-text-strong/40 absolute inset-0"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="AI 금융 코치"
        className="bg-surface sheet-enter relative flex h-[680px] max-h-[85dvh] w-full max-w-(--app-width) flex-col rounded-t-[24px] px-8 pt-6 pb-10"
      >
        <header className="flex items-center justify-between">
          <h2 className="text-text-strong font-bold">AI 금융 코치</h2>
          <button type="button" aria-label="시트 닫기" onClick={onClose} className="p-1">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="text-text-muted size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {session.isPending && (
          <p className="text-caption text-text-sub py-16 text-center">대화를 준비하고 있어요…</p>
        )}
        {session.isError && (
          <div className="flex flex-col items-center gap-3 py-16">
            <p role="alert" className="text-caption text-danger">
              대화를 시작하지 못했어요.
            </p>
            <button
              type="button"
              onClick={() => void session.refetch()}
              className="rounded-button bg-sub px-5 py-2"
            >
              <span className="text-caption text-primary font-semibold">다시 시도하기</span>
            </button>
          </div>
        )}

        {session.isSuccess && (
          <>
            {/* 지금 보고 있는 화면 맥락 */}
            <div className="rounded-card bg-sub mt-4 flex items-center gap-3 p-3.5">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="text-primary size-6 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 3v5h5" />
              </svg>
              <div className="min-w-0">
                <p className="text-caption text-text-sub">
                  지금 보고 있는 {CONTEXT_LABELS[contextType]}
                </p>
                <p className="text-text-strong truncate font-semibold">{session.data.data.title}</p>
              </div>
            </div>

            {/* 대화 영역 */}
            <div
              ref={threadRef}
              className="no-scrollbar my-4 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto"
            >
              {messages.length === 0 && (
                <AssistantBubble
                  content={`안녕하세요! 보고 계신 ${CONTEXT_LABELS[contextType]}에 대해 궁금한 점을 편하게 물어보세요. 아래 추천 질문을 눌러도 돼요.`}
                  example={false}
                />
              )}
              {messages.map((item) =>
                item.role === "USER" ? (
                  <p
                    key={item.id}
                    className="bg-primary text-surface max-w-[85%] self-end rounded-[16px] rounded-tr-[4px] px-3.5 py-2.5 text-[15px] leading-[1.5]"
                  >
                    {item.content}
                  </p>
                ) : (
                  <AssistantBubble key={item.id} content={item.content} example={USE_MOCK} />
                ),
              )}
              {send.isPending && (
                <p className="bg-bg text-text-muted max-w-[85%] self-start rounded-[16px] rounded-tl-[4px] px-3.5 py-2.5 text-[15px]">
                  답변을 쓰고 있어요…
                </p>
              )}
              {sendError && (
                <p role="alert" className="text-caption text-danger">
                  {sendError}
                </p>
              )}
            </div>

            {/* 추천 질문 */}
            {chips.length > 0 && (
              <div className="no-scrollbar -mx-8 mb-3 flex shrink-0 gap-2 overflow-x-auto px-8">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => submit(chip)}
                    disabled={send.isPending}
                    className="bg-sub text-primary text-caption shrink-0 rounded-full px-3.5 py-2 font-semibold disabled:opacity-50"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* 입력 줄 */}
            <form
              className="flex shrink-0 items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                submit(input);
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="질문을 입력하세요"
                maxLength={2000}
                className="bg-bg text-text-strong min-w-0 flex-1 rounded-full px-4 py-2.5 text-[15px] outline-none"
              />
              <button
                type="submit"
                aria-label="질문 보내기"
                disabled={input.trim().length === 0 || send.isPending || sessionId === null}
                className="bg-primary flex size-10 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="text-surface size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * AI 답변 말풍선. "쉽게 말하면:" 뒤는 흰 카드로 분리해요 (docs/figma-api-gaps.md).
 * 목데이터 답변에는 [예시] 를 표시해요 (이슈 #45 완료 조건).
 */
function AssistantBubble({ content, example }: { content: string; example: boolean }) {
  const [body, easy] = content.split(/\n*쉽게 말하면:\s*/);
  return (
    <div className="bg-bg max-w-[85%] self-start rounded-[16px] rounded-tl-[4px] px-3.5 py-2.5">
      {example && <p className="text-caption text-text-muted mb-1">[예시]</p>}
      <p className="text-text-strong text-[15px] leading-[1.5] whitespace-pre-line">{body}</p>
      {easy && (
        <div className="bg-surface border-line mt-2.5 rounded-[12px] border p-3">
          <p className="text-caption text-primary font-semibold">쉽게 말하면</p>
          <p className="text-text mt-1 text-[14px] leading-[1.5]">{easy}</p>
        </div>
      )}
    </div>
  );
}
