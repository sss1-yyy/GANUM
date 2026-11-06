import type { JobStatus } from "@/shared/api";

// SIM-01 / SIM-03
export type SimulationKind = "TIMING" | "DIVERSIFICATION" | "RECURRING";

export interface SimulationInput {
  kind: SimulationKind;
  instrumentIds: string[];
  startDate: string;
  endDate: string;
  amount: number;
  comparisonStartDate: string | null;
  weightsPercent: number[] | null;
}

export interface SeriesPoint {
  date: string;
  value: number;
  cumulativeInvested: number;
}

export interface Scenario {
  label: string;
  investedAmount: number;
  finalValue: number;
  profitLoss: number;
  returnPercent: number;
  series: SeriesPoint[];
}

/** SIM-03 result.reasons (명세 v0.4): "왜 이런 결과가 나왔나요?" 칸 */
export interface SimulationReason {
  type: "NEWS" | "ECONOMY";
  title: string;
  /** 실제 날짜/관측 구간 문구. 예: "2026년 7월 29일", "2026.03.02~2026.03.31" */
  period: string;
  sourceName: string;
  sourceUrl: string;
}

export interface SimulationResult {
  scenarios: Scenario[];
  assumptions: string[];
  explanation: string;
  /** 0~2개 (NEWS·ECONOMY 각각 최대 1개). 비어 있으면 화면에서 칸을 숨겨요 */
  reasons: SimulationReason[];
}

export interface Simulation {
  id: string;
  status: JobStatus;
  input: SimulationInput;
  result: SimulationResult | null;
  errorCode: string | null;
}
