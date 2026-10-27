// NOTI-01 / NOTI-02
export type NoticeTargetType =
  "HOME" | "ASSET" | "BENEFIT" | "REPORT" | "INSTRUMENT" | "SIMULATION";

export interface AppNotification {
  id: string;
  type: "PRICE_CHANGE" | "PORTFOLIO_RISK" | "BENEFIT_DEADLINE" | "REPORT_READY" | "SYSTEM";
  title: string;
  body: string;
  target: { type: NoticeTargetType; resourceId: string | null };
  readAt: string | null;
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  instrumentId: string;
  side: "BUY" | "SELL";
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  netAmount: number;
  createdAt: string;
}
