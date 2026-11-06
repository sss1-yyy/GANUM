import { beforeEach, describe, expect, it } from "vitest";
import { handleMockRequest } from "@/mocks/server";
import { paperState } from "@/mocks/shared/paper";
import { resetMockState } from "@/mocks/store";
import type { PortfolioHistoryPoint } from "../types";

const getHistory = async () => {
  const res = await handleMockRequest({
    method: "GET",
    path: "/paper/portfolio/history",
    query: { from: "2026-10-16", to: "2026-10-23" },
  });
  return (res.body as { data: { items: PortfolioHistoryPoint[] } }).data.items;
};

beforeEach(() => resetMockState());

describe("평가금액 추이 목 API", () => {
  it("보유 종목이 있으면 현금에 그날의 평가액을 더해요", async () => {
    const items = await getHistory();
    expect(items).toHaveLength(8);
    expect(items.every((item) => item.totalValue > paperState().cashBalance)).toBe(true);
  });

  it("보유 종목이 없으면 현금만으로 평평한 선이 돼요", async () => {
    const state = paperState();
    state.positions = [];
    const items = await getHistory();
    expect(items).toHaveLength(8);
    expect(items.every((item) => item.totalValue === state.cashBalance)).toBe(true);
  });
});
