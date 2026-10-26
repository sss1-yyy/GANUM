import { apiGet, apiPost } from "@/shared/api";
import type { ListData } from "@/shared/api";
import type { PaperOrderResult, PlaceOrderBody, PriceInterval, PriceSeries } from "./types";

// PAPER-03 · 모의 주문 체결. Idempotency-Key 필수 — 같은 주문을 두 번 보내도 한 번만 체결돼요.
export const placeOrder = (body: PlaceOrderBody, idempotencyKey: string) =>
  apiPost<PaperOrderResult>("/paper/orders", body, { idempotencyKey });

// PAPER-04 · 모의 거래 기록 (최신순)
export const listOrders = (query?: { side?: "BUY" | "SELL"; instrumentId?: string }) =>
  apiGet<ListData<PaperOrderResult>>("/paper/orders", { query });

// MARKET-03 · 종목 차트
export const getPrices = (
  instrumentId: string,
  params: { from: string; to: string; interval?: PriceInterval },
  signal?: AbortSignal,
) => apiGet<PriceSeries>(`/instruments/${instrumentId}/prices`, { query: params, signal });

export const investKeys = {
  prices: (id: string, from: string, to: string, interval: string) =>
    ["instruments", "prices", id, from, to, interval] as const,
  orders: ["paper", "orders"] as const,
};
