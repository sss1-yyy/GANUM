import { MOCK_TODAY, mockDateAfter } from "@/mocks/clock";
import { ok, validationError } from "@/mocks/helpers";
import { findInstrument } from "@/mocks/shared/instruments";
import { paperState } from "@/mocks/shared/paper";
import { generatePrices } from "@/mocks/shared/prices";
import type { MockRoute } from "@/mocks/types";
import { shiftDate } from "@/shared/lib/format-time";
import type { PortfolioHistoryPoint } from "../types";

/** 목 계좌를 만든 날 ("전체" 기간의 시작) */
const ACCOUNT_OPENED = mockDateAfter(-180);

export const portfolioMockRoutes: MockRoute[] = [
  // [명세 외] 평가금액 추이. 지금 현금 + 지금 보유 수량 × 그날 종가로 계산한 예시 값이에요.
  {
    method: "GET",
    path: "/paper/portfolio/history",
    handler: (request) => {
      const { to = MOCK_TODAY } = request.query;
      const from = request.query.from ?? ACCOUNT_OPENED;
      if (from > to) return validationError([{ field: "to", message: "시작일 이후여야 해요." }]);

      const state = paperState();
      // 보유 종목이 없어도 현금은 있으니, 기간의 모든 날짜를 현금으로 먼저 채워요
      const end = to < MOCK_TODAY ? to : MOCK_TODAY;
      const totals = new Map<string, number>();
      for (let date = from; date <= end; date = shiftDate(date, 1)) {
        totals.set(date, state.cashBalance);
      }
      for (const position of state.positions) {
        const instrument = findInstrument(position.instrumentId);
        if (!instrument) continue;
        for (const point of generatePrices(instrument.id, instrument.price, from, to, "DAY")) {
          totals.set(point.date, totals.get(point.date)! + point.close * position.quantity);
        }
      }
      const items: PortfolioHistoryPoint[] = [...totals].map(([date, totalValue]) => ({
        date,
        totalValue,
      }));
      return ok({ items }, true);
    },
  },
];
