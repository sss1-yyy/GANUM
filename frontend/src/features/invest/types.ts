// PAPER-03 / PAPER-04
export type OrderSide = "BUY" | "SELL";

export interface PaperOrderResult {
  id: string;
  instrumentId: string;
  side: OrderSide;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  status: "FILLED";
  cashBalanceAfter: number;
  createdAt: string;
}

export interface PlaceOrderBody {
  instrumentId: string;
  side: OrderSide;
  quantity: number;
}

// MARKET-03
export type PriceInterval = "DAY" | "WEEK" | "MONTH";

export interface PricePoint {
  date: string;
  close: number;
  volume: number;
}

export interface PriceSeries {
  instrumentId: string;
  interval: PriceInterval;
  points: PricePoint[];
}
