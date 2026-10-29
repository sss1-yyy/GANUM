import type { JobStatus } from "@/shared/api";

/** allocation.category(API 자산 분류) → 화면 이름 */
const CATEGORY_LABELS: Record<string, string> = {
  CASH: "입출금·비상금",
  DEPOSIT: "예적금",
  STOCK: "주식",
  ETF: "ETF",
  CRYPTO: "코인",
  OTHER: "기타",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

/** 아직 완료되지 않은 레포트의 상태 문구 (완료면 null) */
export function pendingStatusLabel(status: JobStatus): string | null {
  if (status === "QUEUED" || status === "RUNNING") return "만드는 중";
  if (status === "FAILED") return "만들지 못했어요";
  return null;
}
