import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/** 화면 맨 아래 큰 버튼 (primary: 보라, secondary: 연보라) */
export function CtaButton({
  variant = "primary",
  disabled,
  onClick,
  children,
}: {
  variant?: "primary" | "secondary";
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-button disabled:bg-line h-[60px] w-full",
        variant === "primary" ? "bg-primary" : "bg-sub",
      )}
    >
      {/* globals.css 의 button { font: inherit } 가 유틸리티보다 우선이라 글자 스타일은 span 에 줘요 */}
      <span
        className={cn(
          "text-subtitle leading-[23px] font-semibold",
          disabled ? "text-text-muted" : variant === "primary" ? "text-surface" : "text-primary",
        )}
      >
        {children}
      </span>
    </button>
  );
}

export function Disclaimer() {
  return (
    <p className="text-caption text-text-sub text-center leading-[18px] font-light">
      과거 결과이며 앞으로를 보장하지 않아요. 특정 종목이나 투자를 권하는 것이 아니에요.
    </p>
  );
}
