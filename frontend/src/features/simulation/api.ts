import { apiGet, apiPost } from "@/shared/api";
import type { Simulation, SimulationInput } from "./types";

// SIM-01 · 실행 요청 (202, QUEUED)
export const createSimulation = (input: SimulationInput) =>
  apiPost<{ id: string; status: "QUEUED" }>("/simulations", input);

// SIM-03 · 결과·상태
export const getSimulation = (id: string, signal?: AbortSignal) =>
  apiGet<Simulation>(`/simulations/${id}`, { signal });

export const simulationKeys = {
  detail: (id: string) => ["simulations", "detail", id] as const,
};

/** 가장 최근 확정 거래일 (목데이터 기준). 실서버에서는 서버가 정한 값을 써야 해요. */
export const LATEST_TRADING_DAY = "2026-10-23";
