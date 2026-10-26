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

export interface Simulation {
  id: string;
  status: JobStatus;
  input: SimulationInput;
  result: { scenarios: Scenario[]; assumptions: string[]; explanation: string } | null;
  errorCode: string | null;
}
