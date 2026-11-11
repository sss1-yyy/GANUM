import { apiGet } from "@/shared/api";
import { sharedKeys } from "@/shared/api/query-keys";
import type { PortfolioHistoryPoint } from "./types";

// [명세 외] 평가금액 추이. Figma 에 있지만 명세에 API 가 없어요 (docs/figma-api-gaps.md).
// from 을 빼면 계좌를 만든 날부터예요. ASSET-04 와 같은 모양으로 맞췄어요.
export const getPortfolioHistory = (from: string | undefined, to: string, signal?: AbortSignal) =>
  apiGet<{ items: PortfolioHistoryPoint[] }>("/paper/portfolio/history", {
    query: { from, to },
    signal,
  });

export const portfolioKeys = {
  history: (from: string | undefined, to: string) =>
    [...sharedKeys.paperPortfolio, "history", from ?? "all", to] as const,
};
