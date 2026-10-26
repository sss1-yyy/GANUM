import { accepted, bodyAsObject, fail, notFound, ok } from "@/mocks/helpers";
import { findInstrument } from "@/mocks/shared/instruments";
import { statusForReadCount } from "@/mocks/shared/jobs";
import { generatePrices } from "@/mocks/shared/prices";
import { chargeTokens } from "@/mocks/shared/usage";
import { mockState, nextMockId } from "@/mocks/store";
import type { MockRoute } from "@/mocks/types";
import type { Scenario, SeriesPoint, Simulation, SimulationInput } from "../types";

const LATEST_TRADING_DAY = "2026-10-23";

interface Stored {
  simulation: Simulation;
  readCount: number;
}
const store = () =>
  mockState<{ items: Record<string, Stored> }>("simulations", () => ({ items: {} }));

const KINDS = ["TIMING", "DIVERSIFICATION", "RECURRING"] as const;

function validate(
  body: Record<string, unknown> | null,
): SimulationInput | { errors: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];
  const b = body ?? {};
  const kind = b.kind as SimulationInput["kind"];
  if (!KINDS.includes(kind))
    errors.push({ field: "kind", message: "시뮬레이션 종류가 올바르지 않아요." });
  const ids = Array.isArray(b.instrumentIds) ? (b.instrumentIds as string[]) : [];
  const [min, max] = kind === "DIVERSIFICATION" ? [2, 5] : [1, 1];
  if (ids.length < min || ids.length > max || new Set(ids).size !== ids.length) {
    errors.push({
      field: "instrumentIds",
      message: `종목을 ${min === max ? min : `${min}~${max}`}개 골라 주세요.`,
    });
  } else if (ids.some((id) => !findInstrument(id))) {
    errors.push({ field: "instrumentIds", message: "알 수 없는 종목이에요." });
  }
  const start = String(b.startDate ?? "");
  const end = String(b.endDate ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || start >= end) {
    errors.push({ field: "startDate", message: "시작일은 종료일보다 앞이어야 해요." });
  } else if (end > LATEST_TRADING_DAY) {
    errors.push({ field: "endDate", message: "최신 거래일 이후는 고를 수 없어요." });
  }
  const amount = b.amount;
  if (
    typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    amount < 1000 ||
    amount > 100_000_000
  ) {
    errors.push({ field: "amount", message: "1,000원 ~ 1억 원 사이로 입력해 주세요." });
  }
  const comparison = (b.comparisonStartDate as string | null | undefined) ?? null;
  if (kind === "TIMING" && (!comparison || comparison <= start || comparison >= end)) {
    errors.push({
      field: "comparisonStartDate",
      message: "비교할 시점은 시작일과 종료일 사이여야 해요.",
    });
  }
  if (errors.length > 0) return { errors };
  return {
    kind,
    instrumentIds: ids,
    startDate: start,
    endDate: end,
    amount: amount as number,
    comparisonStartDate: kind === "TIMING" ? comparison : null,
    weightsPercent:
      kind === "DIVERSIFICATION"
        ? Array.isArray(b.weightsPercent)
          ? (b.weightsPercent as number[])
          : equalWeights(ids.length)
        : null,
  };
}

function equalWeights(n: number): number[] {
  const base = Math.floor(100 / n);
  return Array.from({ length: n }, (_, i) => (i === 0 ? 100 - base * (n - 1) : base));
}

function closes(id: string, from: string, to: string): SeriesPoint[] & { close?: never } {
  const instrument = findInstrument(id)!;
  return generatePrices(id, instrument.price, from, to, "DAY").map((p) => ({
    date: p.date,
    value: p.close,
    cumulativeInvested: 0,
  }));
}

function scenario(label: string, invested: number, series: SeriesPoint[]): Scenario {
  const finalValue = series.at(-1)?.value ?? 0;
  const profitLoss = finalValue - invested;
  return {
    label,
    investedAmount: invested,
    finalValue,
    profitLoss,
    returnPercent: invested > 0 ? Math.round((profitLoss / invested) * 1000) / 10 : 0,
    series,
  };
}

/** 한 번에 amount 를 start 일의 종가로 사서 끝까지 들고 있는 경우 */
function lumpSum(id: string, amount: number, start: string, end: string): SeriesPoint[] {
  const prices = closes(id, start, end);
  const first = prices[0]?.value ?? 1;
  const shares = amount / first;
  return prices.map((p) => ({
    date: p.date,
    value: Math.round(shares * p.value),
    cumulativeInvested: amount,
  }));
}

function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + months, d)).toISOString().slice(0, 10);
}

function md(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${m}월 ${d}일`;
}

function compute(input: SimulationInput): Simulation["result"] {
  const [primary] = input.instrumentIds;
  const name = (id: string) => findInstrument(id)!.name;
  const assumptions = [
    "체결가는 해당일 종가로 계산했어요.",
    "수수료·세금·배당은 반영하지 않았어요.",
    "소수점 주식도 살 수 있다고 가정했어요.",
  ];

  if (input.kind === "TIMING") {
    const a = lumpSum(primary!, input.amount, input.startDate, input.endDate);
    const b = lumpSum(primary!, input.amount, input.comparisonStartDate!, input.endDate);
    const sa = scenario(`${md(input.startDate)}에 매수`, input.amount, a);
    const sb = scenario(`${md(input.comparisonStartDate!)}에 매수`, input.amount, b);
    const diff = Math.abs(sa.profitLoss - sb.profitLoss);
    const better = sa.profitLoss >= sb.profitLoss ? sa.label : sb.label;
    return {
      scenarios: [sa, sb],
      assumptions,
      explanation: `${name(primary!)}을(를) ${better}한 쪽이 ${diff.toLocaleString("ko-KR")}원 더 벌었어요.`,
    };
  }

  if (input.kind === "DIVERSIFICATION") {
    const weights = input.weightsPercent!;
    const parts = input.instrumentIds.map((id, i) =>
      lumpSum(id, (input.amount * weights[i]!) / 100, input.startDate, input.endDate),
    );
    const length = Math.min(...parts.map((p) => p.length));
    const mix: SeriesPoint[] = Array.from({ length }, (_, i) => ({
      date: parts[0]![i]!.date,
      value: parts.reduce((sum, p) => sum + p[i]!.value, 0),
      cumulativeInvested: input.amount,
    }));
    const focus = lumpSum(primary!, input.amount, input.startDate, input.endDate);
    const sm = scenario(`분산 투자 (${input.instrumentIds.length}종목)`, input.amount, mix);
    const sf = scenario(`${name(primary!)}만 집중`, input.amount, focus);
    const diff = Math.abs(sm.profitLoss - sf.profitLoss);
    return {
      scenarios: [sm, sf],
      assumptions: [...assumptions, `비중: ${weights.join(" / ")} (%)`],
      explanation: `수익은 ${sf.profitLoss >= sm.profitLoss ? "집중" : "분산"}이 ${diff.toLocaleString("ko-KR")}원 더 컸어요.`,
    };
  }

  // RECURRING: 매달 amount 적립 vs 첫 달에 총액을 한 번에
  const dates: string[] = [];
  for (let i = 0; addMonths(input.startDate, i) <= input.endDate; i += 1)
    dates.push(addMonths(input.startDate, i));
  const prices = closes(primary!, input.startDate, input.endDate);
  const priceOn = (d: string) => prices.find((p) => p.date >= d)?.value ?? prices.at(-1)!.value;
  const total = input.amount * dates.length;
  let shares = 0;
  let invested = 0;
  const dca: SeriesPoint[] = prices.map((p) => {
    while (
      dates.length > 0 &&
      invested / input.amount < dates.length &&
      dates[invested / input.amount]! <= p.date
    ) {
      shares += input.amount / priceOn(dates[invested / input.amount]!);
      invested += input.amount;
    }
    return { date: p.date, value: Math.round(shares * p.value), cumulativeInvested: invested };
  });
  const lump = lumpSum(primary!, total, input.startDate, input.endDate);
  const sd = scenario("적립식 투자", total, dca);
  const sl = scenario("한 번에 투자", total, lump);
  const diff = Math.abs(sd.profitLoss - sl.profitLoss);
  return {
    scenarios: [sd, sl],
    assumptions: [
      ...assumptions,
      `매달 ${input.amount.toLocaleString("ko-KR")}원, 총 ${dates.length}회 납입`,
    ],
    explanation: `${sl.profitLoss >= sd.profitLoss ? "한 번에 넣었을 때" : "나눠 넣었을 때"} ${diff.toLocaleString("ko-KR")}원 더 벌었어요.`,
  };
}

export const simulationMockRoutes: MockRoute[] = [
  // SIM-01
  {
    method: "POST",
    path: "/simulations",
    handler: (request) => {
      const checked = validate(bodyAsObject(request));
      if ("errors" in checked) {
        return fail(422, "INVALID_SIMULATION", "입력값을 확인해 주세요.", checked.errors);
      }
      // ⚠ Figma 의 "무료 3회"는 질문 3개를 한 번에 돌리는 것을 1회로 센 것처럼 보여요.
      //    그래서 목에서는 3개 중 첫 번째(TIMING) 요청에서만 토큰을 차감합니다. (차감 기준은 팀 확정 필요)
      if (checked.kind === "TIMING" && !chargeTokens("SIMULATION")) {
        return fail(409, "TOKEN_INSUFFICIENT", "이용권이 부족해요.");
      }
      const id = nextMockId("sim");
      store().items[id] = {
        readCount: 0,
        simulation: { id, status: "QUEUED", input: checked, result: null, errorCode: null },
      };
      return accepted({ id, status: "QUEUED" });
    },
  },

  // SIM-03
  {
    method: "GET",
    path: "/simulations/:simulationId",
    handler: (request) => {
      const stored = store().items[request.params.simulationId ?? ""];
      if (!stored) return notFound("시뮬레이션을 찾을 수 없어요.");
      const status = statusForReadCount(stored.readCount);
      stored.readCount += 1;
      const result = status === "SUCCEEDED" ? compute(stored.simulation.input) : null;
      return ok({ ...stored.simulation, status, result }, true);
    },
  },
];
