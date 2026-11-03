import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { TopBar } from "./TopBar";

/**
 * 화면 틀(상단 바 + 스크롤 영역). 앱 화면 높이(100dvh)에 맞추고 상단 바는 고정한 채, 그 아래 내용만 스크롤해요.
 * (웹페이지 전체가 스크롤되지 않도록)
 */
export function ScreenFrame({
  className,
  onBack,
  hideBack,
  children,
}: {
  className?: string;
  /** 상단 바 뒤로 가기를 화면 안 동작으로 바꿀 때 (TopBar 참고) */
  onBack?: () => void;
  /** 상단 바 뒤로 가기를 숨길 때 (TopBar 참고) */
  hideBack?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col">
      <TopBar onBack={onBack} hideBack={hideBack} />
      <main
        className={cn(
          "no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-8 pt-2.5 pb-10",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
