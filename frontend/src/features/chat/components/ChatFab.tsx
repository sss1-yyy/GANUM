"use client";

import { useEffect, useState } from "react";
import { onOpenChatRequest } from "@/shared/lib/chat-open";
import { cn } from "@/shared/lib/cn";
import type { ChatContextType } from "@/shared/types";
import { ChatSheet } from "./ChatSheet";

/**
 * 화면 우하단의 보라색 AI 버튼. 누르면 AI 금융 코치 시트가 열려요.
 * 각 화면 담당자는 이 컴포넌트 한 줄로 챗봇을 붙일 수 있어요:
 * `<ChatFab contextType="INSTRUMENT" contextId={instrumentId} />`
 */
export function ChatFab({
  contextType,
  contextId = null,
  className,
}: {
  contextType: ChatContextType;
  contextId?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  // 다른 기능 폴더(예: 종목 상세 "쉽게 설명 듣기")에서 requestOpenChat() 으로도 열 수 있어요
  useEffect(() => onOpenChatRequest(() => setOpen(true)), []);

  return (
    <>
      <button
        type="button"
        aria-label="AI 금융 코치 열기"
        onClick={() => setOpen(true)}
        className={cn(
          // 앱 틀(--app-width) 안쪽 오른쪽 아래에 고정 (넓은 화면에서도 틀 밖으로 안 나가게)
          "shadow-ai from-coach to-primary fixed bottom-6 z-40 flex size-12 items-center justify-center rounded-full bg-gradient-to-br",
          "right-[max(1.25rem,calc(50vw-(var(--app-width)/2)+1.25rem))]",
          // Figma: AI 버튼은 화면 맨 아래 요소 위 16px 에 떠요. 탭바·주문 버튼에 붙인
          // data-chat-fab-above 표시를 보고 올려서, 화면마다 따로 고칠 필요가 없어요.
          "[body:has([data-chat-fab-above=tab-bar])_&]:bottom-[95px]", // 탭바(79px) 위 16px
          "[body:has([data-chat-fab-above=order-cta])_&]:bottom-[108px]", // 모의 매수/매도 버튼 위 16px
          // 주문 화면에 탭바가 붙으면(Figma 참고) 두 높이를 합쳐요
          "[body:has([data-chat-fab-above=tab-bar]):has([data-chat-fab-above=order-cta])_&]:bottom-[187px]",
          className,
        )}
      >
        <span className="text-surface text-[15px] font-bold">AI</span>
      </button>
      {open && (
        <ChatSheet contextType={contextType} contextId={contextId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
