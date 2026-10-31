import { shiftDate } from "@/shared/lib/format-time";
import { formatDotDate, formatKRW } from "@/shared/lib/format";
import type { Instrument } from "@/shared/types";
import { shiftMonths } from "./dates";
import { DIVERSIFICATION_MAX, FIXED_AMOUNT, TIMING_COMPARE_MONTHS } from "./labels";
import type { SimulationInput, SimulationKind } from "./types";

/** 입력 화면에서 고른 조건 (API 로 보내기 전 상태) */
export interface SimulationDraft {
  TIMING: { instrument: Instrument | null; startDate: string | null };
  DIVERSIFICATION: { startDate: string | null; instruments: Instrument[] };
  RECURRING: { amount: number | null; startDate: string | null; instrument: Instrument | null };
}

export const EMPTY_DRAFT: SimulationDraft = {
  TIMING: { instrument: null, startDate: null },
  DIVERSIFICATION: { startDate: null, instruments: [] },
  RECURRING: { amount: null, startDate: null, instrument: null },
};

export function isComplete(draft: SimulationDraft, kind: SimulationKind): boolean {
  switch (kind) {
    case "TIMING":
      return Boolean(draft.TIMING.instrument && draft.TIMING.startDate);
    case "DIVERSIFICATION":
      return Boolean(
        draft.DIVERSIFICATION.startDate &&
        draft.DIVERSIFICATION.instruments.length >= 2 &&
        draft.DIVERSIFICATION.instruments.length <= DIVERSIFICATION_MAX,
      );
    case "RECURRING":
      return Boolean(
        draft.RECURRING.amount && draft.RECURRING.startDate && draft.RECURRING.instrument,
      );
  }
}

/** 고를 수 있는 가장 늦은 시작일. Q1 은 한 달 뒤 비교 시점도 종료일 전이어야 해요 */
export function latestStartDate(kind: SimulationKind, endDate: string): string {
  if (kind === "TIMING") return shiftDate(shiftMonths(endDate, -TIMING_COMPARE_MONTHS), -1);
  return shiftDate(endDate, -1);
}

/** 완성된 조건을 SIM-01 요청 본문으로 바꿔요. (완성되지 않았으면 null) */
export function toSimulationInput(
  draft: SimulationDraft,
  kind: SimulationKind,
  endDate: string,
): SimulationInput | null {
  if (!isComplete(draft, kind)) return null;
  const base = { kind, endDate, comparisonStartDate: null, weightsPercent: null };
  switch (kind) {
    case "TIMING": {
      const startDate = draft.TIMING.startDate!;
      return {
        ...base,
        instrumentIds: [draft.TIMING.instrument!.id],
        startDate,
        amount: FIXED_AMOUNT.TIMING,
        comparisonStartDate: shiftMonths(startDate, TIMING_COMPARE_MONTHS),
      };
    }
    case "DIVERSIFICATION":
      // weightsPercent 를 비우면 서버가 같은 비중으로 나눠요
      return {
        ...base,
        instrumentIds: draft.DIVERSIFICATION.instruments.map((item) => item.id),
        startDate: draft.DIVERSIFICATION.startDate!,
        amount: FIXED_AMOUNT.DIVERSIFICATION,
      };
    case "RECURRING":
      return {
        ...base,
        instrumentIds: [draft.RECURRING.instrument!.id],
        startDate: draft.RECURRING.startDate!,
        amount: draft.RECURRING.amount!,
      };
  }
}

/** "삼성전자 외 2개" */
export function instrumentsLabel(items: Instrument[]): string {
  if (items.length === 0) return "";
  return items.length === 1 ? items[0].name : `${items[0].name} 외 ${items.length - 1}개`;
}

/** 접힌 카드에 보여줄 한 줄 요약 */
export function draftSummary(draft: SimulationDraft, kind: SimulationKind): string {
  switch (kind) {
    case "TIMING":
      return `${draft.TIMING.instrument!.name} · ${formatDotDate(draft.TIMING.startDate!)}`;
    case "DIVERSIFICATION":
      return `${formatDotDate(draft.DIVERSIFICATION.startDate!)} 시작 · ${draft.DIVERSIFICATION.instruments
        .map((item) => item.name)
        .join(", ")}`;
    case "RECURRING":
      return `${draft.RECURRING.instrument!.name} · 월 ${formatKRW(draft.RECURRING.amount!)} · ${formatDotDate(draft.RECURRING.startDate!)}부터 · 매달`;
  }
}
