import { MOCK_NOW } from "../clock";
import { mockState, nextMockId } from "../store";
import { findInstrument } from "./instruments";
import type { Holding, PaperAllocation, PaperPortfolio } from "@/shared/types";

/**
 * 모의투자 계좌 상태 (PAPER-01 / 03 / 04).
 *
 * 시작 값은 Figma 주문 화면 기준입니다.
 * - 주문 가능 금액(= 가상 현금) 10,034,002원 → 2주(3,682,000원) 매수하면 6,352,002원이 남음
 * - SK하이닉스 보유 2주, 평균 매수가 1,833,600원 → 1주 매도하면 현금 8,193,002원
 * Figma 의 화면마다 "총 평가금액"이 서로 달라서(10,034,002원 ↔ 주문 화면), 현금을 기준으로 맞추고
 * 나머지 값은 거기서 계산합니다. 자세한 내용은 docs/figma-api-gaps.md 를 보세요.
 */
export interface PaperPosition {
  instrumentId: string;
  quantity: number;
  averagePrice: number;
}

export interface PaperOrder {
  id: string;
  instrumentId: string;
  side: "BUY" | "SELL";
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  status: "FILLED";
  cashBalanceAfter: number;
  createdAt: string;
}

interface IdempotentRecord {
  fingerprint: string;
  order: PaperOrder;
}

export interface PaperState {
  id: string;
  initialBalance: number;
  cashBalance: number;
  positions: PaperPosition[];
  /** 최신순 */
  orders: PaperOrder[];
  idempotency: Record<string, IdempotentRecord>;
}

export const paperState = (): PaperState =>
  mockState<PaperState>("paper", () => ({
    id: "paper_demo_01",
    // 총 평가금액 18,172,002원 에서 수익률이 +2.4% 가 되도록 정한 시작 금액 (예시)
    initialBalance: 17_746_000,
    cashBalance: 10_034_002,
    positions: [
      { instrumentId: "ins_005930", quantity: 11, averagePrice: 272_000 },
      { instrumentId: "ins_000660", quantity: 2, averagePrice: 1_833_600 },
      { instrumentId: "ins_069500", quantity: 5, averagePrice: 285_700 },
    ],
    orders: [],
    idempotency: {},
  }));

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildHoldings(state: PaperState): Holding[] {
  const rows = state.positions
    .filter((position) => position.quantity > 0)
    .map((position) => {
      const instrument = findInstrument(position.instrumentId);
      const currentPrice = instrument?.price ?? 0;
      const marketValue = currentPrice * position.quantity;
      const cost = position.averagePrice * position.quantity;
      return { position, instrument, currentPrice, marketValue, cost };
    });
  const holdingsValue = rows.reduce((sum, row) => sum + row.marketValue, 0);

  return rows.map(({ position, instrument, currentPrice, marketValue, cost }) => ({
    instrumentId: position.instrumentId,
    name: instrument?.name ?? position.instrumentId,
    quantity: String(position.quantity),
    averagePrice: String(position.averagePrice),
    currentPrice,
    marketValue,
    profitLoss: marketValue - cost,
    profitLossPercent: cost > 0 ? roundPercent(((marketValue - cost) / cost) * 100) : null,
    weightPercent: holdingsValue > 0 ? roundPercent((marketValue / holdingsValue) * 100) : 0,
  }));
}

export function buildAllocation(state: PaperState, holdings: Holding[]): PaperAllocation[] {
  let stock = 0;
  let etf = 0;
  for (const holding of holdings) {
    const type = findInstrument(holding.instrumentId)?.type;
    if (type === "ETF") etf += holding.marketValue;
    else stock += holding.marketValue;
  }
  const total = stock + etf + state.cashBalance;
  const weight = (amount: number) => (total > 0 ? roundPercent((amount / total) * 100) : 0);
  return [
    { type: "STOCK", amount: stock, weightPercent: weight(stock) },
    { type: "ETF", amount: etf, weightPercent: weight(etf) },
    { type: "CASH", amount: state.cashBalance, weightPercent: weight(state.cashBalance) },
  ];
}

export function buildPortfolio(state: PaperState = paperState()): PaperPortfolio {
  const holdings = buildHoldings(state);
  const holdingsValue = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  const totalValue = state.cashBalance + holdingsValue;
  const profitLoss = totalValue - state.initialBalance;
  return {
    id: state.id,
    initialBalance: state.initialBalance,
    cashBalance: state.cashBalance,
    holdingsValue,
    totalValue,
    profitLoss,
    returnPercent: roundPercent((profitLoss / state.initialBalance) * 100),
    holdings,
    allocation: buildAllocation(state, holdings),
  };
}

export type OrderFailure =
  | { ok: false; status: 404; code: "NOT_FOUND"; message: string }
  | {
      ok: false;
      status: 409;
      code: "INSUFFICIENT_BALANCE" | "INSUFFICIENT_HOLDINGS";
      message: string;
    };

export type OrderResult = { ok: true; order: PaperOrder } | OrderFailure;

/** 수수료는 아직 정해지지 않아 0원으로 둡니다. (명세서: 초기금·수수료·체결 가격 기준은 팀 확정 필요) */
export const MOCK_FEE_RATE = 0;

export function executeOrder(
  instrumentId: string,
  side: "BUY" | "SELL",
  quantity: number,
  state: PaperState = paperState(),
): OrderResult {
  const instrument = findInstrument(instrumentId);
  if (!instrument) {
    return { ok: false, status: 404, code: "NOT_FOUND", message: "종목을 찾을 수 없어요." };
  }

  const unitPrice = instrument.price;
  const grossAmount = unitPrice * quantity;
  const feeAmount = Math.round(grossAmount * MOCK_FEE_RATE);
  const position = state.positions.find((item) => item.instrumentId === instrumentId);

  if (side === "BUY") {
    const netAmount = grossAmount + feeAmount;
    if (netAmount > state.cashBalance) {
      return {
        ok: false,
        status: 409,
        code: "INSUFFICIENT_BALANCE",
        message: "주문 가능 금액이 부족해요.",
      };
    }
    state.cashBalance -= netAmount;
    if (position) {
      const totalCost = position.averagePrice * position.quantity + grossAmount;
      position.quantity += quantity;
      position.averagePrice = Math.round(totalCost / position.quantity);
    } else {
      state.positions.push({ instrumentId, quantity, averagePrice: unitPrice });
    }
    return {
      ok: true,
      order: record(
        state,
        instrumentId,
        side,
        quantity,
        unitPrice,
        grossAmount,
        feeAmount,
        netAmount,
      ),
    };
  }

  if (!position || position.quantity < quantity) {
    return {
      ok: false,
      status: 409,
      code: "INSUFFICIENT_HOLDINGS",
      message: "보유 수량이 부족해요.",
    };
  }
  const netAmount = grossAmount - feeAmount;
  position.quantity -= quantity;
  state.cashBalance += netAmount;
  if (position.quantity === 0) {
    state.positions = state.positions.filter((item) => item.instrumentId !== instrumentId);
  }
  return {
    ok: true,
    order: record(
      state,
      instrumentId,
      side,
      quantity,
      unitPrice,
      grossAmount,
      feeAmount,
      netAmount,
    ),
  };
}

function record(
  state: PaperState,
  instrumentId: string,
  side: "BUY" | "SELL",
  quantity: number,
  unitPrice: number,
  grossAmount: number,
  feeAmount: number,
  netAmount: number,
): PaperOrder {
  const order: PaperOrder = {
    id: nextMockId("order"),
    instrumentId,
    side,
    quantity,
    unitPrice,
    grossAmount,
    feeAmount,
    netAmount,
    status: "FILLED",
    cashBalanceAfter: state.cashBalance,
    createdAt: MOCK_NOW,
  };
  state.orders.unshift(order);
  return order;
}
