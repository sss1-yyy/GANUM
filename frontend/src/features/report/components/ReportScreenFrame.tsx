import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { ReportTopBar } from "./ReportTopBar";

/**
 * 레포트 화면 틀. 앱 화면 높이(100dvh)에 맞추고 상단 바는 고정한 채, 그 아래 내용만 스크롤해요.
 * (웹페이지 전체가 스크롤되지 않도록)
 */
export function ReportScreenFrame({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col">
      <ReportTopBar />
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
