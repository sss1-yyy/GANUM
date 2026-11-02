import { describe, expect, it } from "vitest";
import { shiftMonths } from "./dates";
import { maxDrawdownPercent } from "./drawdown";

const point = (value: number, cumulativeInvested: number) => ({
  date: "2026-08-15",
  value,
  cumulativeInvested,
});

describe("maxDrawdownPercent", () => {
  it("원금 대비 가장 많이 줄었던 순간의 손실률", () => {
    expect(
      maxDrawdownPercent([
        point(200_000, 200_000),
        point(184_000, 200_000),
        point(227_000, 200_000),
      ]),
    ).toBe(-8);
  });

  it("원금 아래로 내려간 적이 없으면 0", () => {
    expect(maxDrawdownPercent([point(200_000, 200_000), point(210_000, 200_000)])).toBe(0);
  });

  it("적립식처럼 원금이 늘어나도 그 시점 원금 기준으로 계산", () => {
    expect(maxDrawdownPercent([point(95_000, 100_000), point(196_000, 200_000)])).toBe(-5);
  });

  it("아직 넣은 돈이 없는 날은 건너뜀", () => {
    expect(maxDrawdownPercent([point(0, 0), point(99_000, 100_000)])).toBe(-1);
  });
});

describe("shiftMonths", () => {
  it("달을 옮기고, 없는 날은 그 달 말일로 맞춤", () => {
    expect(shiftMonths("2026-10-23", -3)).toBe("2026-07-23");
    expect(shiftMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(shiftMonths("2026-01-15", -12)).toBe("2025-01-15");
  });
});
