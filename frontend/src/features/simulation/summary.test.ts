import { describe, expect, it } from "vitest";
import { compareSummary } from "./summary";
import type { Scenario } from "./types";

/** 원금 1,000,000원, 중간 최저 평가금액(low)과 최종 평가금액(final)만 정한 시나리오 */
const scenario = (low: number, final: number): Scenario => ({
  label: "",
  investedAmount: 1_000_000,
  finalValue: final,
  profitLoss: final - 1_000_000,
  returnPercent: 0,
  series: [
    { date: "2026-08-15", value: low, cumulativeInvested: 1_000_000 },
    { date: "2026-10-23", value: final, cumulativeInvested: 1_000_000 },
  ],
});

describe("compareSummary", () => {
  it("Q1: 그때 샀다면 더 벌었지만 중간에 내려간 경우 (Figma 예시)", () => {
    expect(
      compareSummary("TIMING", scenario(920_000, 1_135_000), scenario(940_000, 1_050_000)),
    ).toEqual(["그때 샀다면 85,000원을 더 벌었을 거예요.", "하지만 중간엔 -8.0%까지 내려갔어요."]);
  });

  it("Q1: 덜 벌었으면 '하지만' 없이", () => {
    expect(
      compareSummary("TIMING", scenario(950_000, 1_000_000), scenario(1_000_000, 1_050_000)),
    ).toEqual(["그때 샀다면 50,000원을 덜 벌었을 거예요.", "중간엔 -5.0%까지 내려갔어요."]);
  });

  it("Q2: 집중이 더 벌었지만 분산이 덜 흔들림 (Figma 예시)", () => {
    expect(
      compareSummary("DIVERSIFICATION", scenario(955_000, 1_063_250), scenario(880_000, 1_130_000)),
    ).toEqual(["수익은 집중이 66,750원 더 컸어요.", "하지만 분산이 덜 흔들렸어요."]);
  });

  it("Q3: 한 번에 넣은 쪽이 더 벌었지만 더 크게 흔들림 (Figma 예시)", () => {
    expect(
      compareSummary("RECURRING", scenario(968_000, 1_302_000), scenario(902_000, 1_368_000)),
    ).toEqual(["한 번에 넣었다면 66,000원 더,", "하지만 더 크게 흔들렸어요."]);
  });

  it("수익이 같으면 한 줄만", () => {
    expect(
      compareSummary("RECURRING", scenario(900_000, 1_100_000), scenario(950_000, 1_100_000)),
    ).toEqual(["두 방법의 수익이 같았어요.", null]);
  });
});
