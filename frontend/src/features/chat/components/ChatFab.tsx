"use client";

import { useState } from "react";
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
