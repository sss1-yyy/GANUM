import { apiGet, apiPatch, apiPut } from "./client";
import type { ListData, QueryParams } from "./types";
import type {
  AssetHistoryPoint,
  FinancialProfile,
  Goal,
  Instrument,
  InstrumentDetail,
  InvestmentProfile,
  PaperPortfolio,
  User,
} from "@/shared/types";

/**
 * 여러 기능이 함께 쓰는 API 호출만 모아둔 파일입니다.
 * 한 기능에서만 쓰는 호출은 src/features/<기능>/api.ts 에 직접 만드세요.
 */

// USER-01
export const getMe = () => apiGet<User>("/me");

// MARKET-01 · 종목 검색·랭킹
export interface InstrumentsQuery extends QueryParams {
  query?: string;
  type?: "STOCK" | "ETF";
  sort?: "TRADING_VALUE" | "VOLUME" | "GAINERS" | "LOSERS";
  cursor?: string;
  limit?: number;
}
export const getInstruments = (query?: InstrumentsQuery) =>
  apiGet<ListData<Instrument>>("/instruments", { query });

// MARKET-02 · 종목 상세
export const getInstrument = (instrumentId: string) =>
  apiGet<InstrumentDetail>(`/instruments/${instrumentId}`);

// PAPER-01 · 모의계좌·포트폴리오
export const getPaperPortfolio = () => apiGet<PaperPortfolio>("/paper/portfolio");

// PROFILE-03 · 최근 성향 결과 (미진단이면 data: null)
export const getLatestInvestmentProfile = () =>
  apiGet<InvestmentProfile | null>("/investment-profiles/latest");

// ASSET-04 · 자산 추이 (날짜 오름차순, 기간 최대 366일)
export const getAssetHistory = (from: string, to: string) =>
  apiGet<ListData<AssetHistoryPoint>>("/assets/history", { query: { from, to } });

// GOAL-01 · 금융 목표 (미설정이면 data: null)
export const getGoal = () => apiGet<Goal | null>("/me/goal");

// USAGE-01 · 플랜·잔여 이용량
export interface Usage {
  plan: "FREE" | "PAID";
  tokenBalance: number;
  tokensGranted: number;
  tokensUsed: number;
  resetsAt: string | null;
  costs: Array<{ feature: "CHAT" | "REPORT" | "SIMULATION"; tokens: number }>;
}
export const getUsage = () => apiGet<Usage>("/me/usage");

/** 이용권 잔여로 "남은 이용 횟수" 계산 (예: 잔여 6, 레포트 3개 → 2회) */
export function remainingRuns(usage: Usage, feature: "CHAT" | "REPORT" | "SIMULATION"): number {
  const cost = usage.costs.find((item) => item.feature === feature)?.tokens ?? 0;
  return cost > 0 ? Math.floor(usage.tokenBalance / cost) : 0;
}

// USER-02 / USER-03 · 내 재정정보 조회·수정 (보낸 필드만 수정, null 은 미입력으로 초기화)
export const getFinancialProfile = () => apiGet<FinancialProfile>("/me/financial-profile");
export const patchFinancialProfile = (body: Partial<Omit<FinancialProfile, "updatedAt">>) =>
  apiPatch<FinancialProfile>("/me/financial-profile", body);

// GOAL-02 · 금융 목표 저장
export const putGoal = (body: { title: string; targetAmount: number; targetDate: string }) =>
  apiPut<Goal>("/me/goal", body);
