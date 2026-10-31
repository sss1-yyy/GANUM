"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/** 아래에서 올라오는 시트. 바깥(어두운 영역)을 누르거나 Esc 를 누르면 닫혀요 */
export function BottomSheet({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
        aria-label={title}
        className="bg-surface no-scrollbar relative flex max-h-[90dvh] w-full max-w-(--app-width) flex-col gap-4 overflow-y-auto rounded-t-[24px] px-8 pt-6 pb-10 *:shrink-0"
      >
        <div className="flex justify-center">
          <div className="bg-line h-1 w-10 rounded-[2px]" />
        </div>
        <div className="flex flex-col gap-1.5 leading-[1.4]">
          <h2 className="text-title text-text-strong font-semibold">{title}</h2>
          <p className="text-caption text-text-sub font-medium">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn("shrink-0 rounded-full px-3.5 py-2", active ? "bg-primary" : "bg-bg")}
    >
      <span className={cn("text-caption font-semibold", active ? "text-surface" : "text-text-sub")}>
        {children}
      </span>
    </button>
  );
}

/** 시트 맨 아래 확인 버튼 */
export function SheetCta({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="pt-2">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="rounded-button bg-primary disabled:bg-line h-[60px] w-full"
      >
        {/* globals.css 의 button { font: inherit } 가 유틸리티보다 우선이라 글자 스타일은 span 에 줘요 */}
        <span
          className={cn(
            "text-subtitle font-semibold",
            disabled ? "text-text-muted" : "text-surface",
          )}
        >
          {children}
        </span>
      </button>
    </div>
  );
}
