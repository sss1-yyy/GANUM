import { apiGet, apiPost, pollUntilDone } from "@/shared/api";
import type { Simulation, SimulationInput } from "./types";

// SIM-01 · 실행 요청 (202, QUEUED)
export const createSimulation = (input: SimulationInput) =>
  apiPost<{ id: string; status: "QUEUED" }>("/simulations", input);

// SIM-03 · 결과·상태
export const getSimulation = (id: string, signal?: AbortSignal) =>
  apiGet<Simulation>(`/simulations/${id}`, { signal });

/** 실행 요청 후 SUCCEEDED/FAILED 가 될 때까지 기다립니다. */
export async function runSimulation(
  input: SimulationInput,
  signal?: AbortSignal,
): Promise<Simulation> {
  const created = await createSimulation(input);
  const id = created.data.id;
  return pollUntilDone(async () => (await getSimulation(id, signal)).data, { signal });
}

/** 가장 최근 확정 거래일 (목데이터 기준). 실서버에서는 서버가 정한 값을 써야 해요. */
export const LATEST_TRADING_DAY = "2026-10-23";
