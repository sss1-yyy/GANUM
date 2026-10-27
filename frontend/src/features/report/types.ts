import type { JobStatus } from "@/shared/api";

// REPORT-01 / REPORT-03
export type ReportKind = "FINANCIAL" | "PAPER";

export interface FinancialSummary {
  totalAssets: number;
  totalDebt: number;
  monthlyIncome: number | null;
  monthlyExpense: number | null;
  monthlySurplus: number | null;
}
export interface PaperSummary {
  totalValue: number;
  profitLoss: number;
  returnPercent: number;
}

export interface ReportAllocation {
  category: string;
  weightPercent: number;
  reason: string;
}
export interface ReportAdvice {
  title: string;
  description: string;
  considerations: string[];
}
export interface ReportSource {
  title: string;
  url: string | null;
  asOf: string | null;
}

export interface Report {
  id: string;
  kind: ReportKind;
  status: JobStatus;
  summary: FinancialSummary | PaperSummary | null;
  allocation: ReportAllocation[];
  risks: string[];
  priceChangeReasons: string[];
  advice: ReportAdvice[];
  sources: ReportSource[];
  limitations: string[];
  errorCode: string | null;
  createdAt: string;
}

/** [명세 외] GET /reports — 이전 레포트 목록. 명세에는 목록 API 가 없어서 필요한 최소 필드만 제안합니다. */
export interface ReportListItem {
  id: string;
  kind: ReportKind;
  status: JobStatus;
  /** 목록에 보여줄 한 줄 제목들(조언 제목 최대 3개) */
  headlines: string[];
  createdAt: string;
}
