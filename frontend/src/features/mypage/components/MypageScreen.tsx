import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ScreenFrame } from "@/components/layout/ScreenFrame";

export const cardClass = "rounded-card bg-surface shadow-card p-5";
export const buttonClass =
  "min-h-11 rounded-button bg-primary px-4 py-2 font-semibold text-surface disabled:opacity-60";
export const secondaryButtonClass =
  "min-h-11 rounded-button bg-sub px-4 py-2 font-semibold text-primary disabled:opacity-60";

export function MypageScreen({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <ScreenFrame onBack={() => router.push("/menu")} className="gap-5">
      <div className="space-y-1">
        <h1 className="text-title text-text-strong font-bold">{title}</h1>
        <p className="text-text-sub text-sm">{description}</p>
      </div>
      {children}
    </ScreenFrame>
  );
}

export function Loading() {
  return (
    <p role="status" className="text-text-sub text-sm">
      불러오고 있어요.
    </p>
  );
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className={cardClass}>
      <p role="alert" className="text-danger mb-3 text-sm">
        정보를 불러오지 못했어요.
      </p>
      <button type="button" className={secondaryButtonClass} onClick={onRetry}>
        다시 시도해요
      </button>
    </div>
  );
}

export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-text-sub shrink-0 text-sm">{label}</dt>
      <dd className="text-text-strong text-right text-sm font-semibold wrap-anywhere">
        {children}
      </dd>
    </div>
  );
}
