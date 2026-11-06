import { describe, expect, it } from "vitest";
import { trendLine } from "./chart";

describe("trendLine", () => {
  it("가장 작은 값은 아래, 가장 큰 값은 위, 양 끝은 차트 끝에 닿아요", () => {
    expect(trendLine([100, 300, 200])).toBe("0.0,74.0 140.5,12.0 281.0,43.0");
  });

  it("값이 모두 같으면 가운데 가로선이에요", () => {
    expect(trendLine([500, 500])).toBe("0.0,43.0 281.0,43.0");
  });

  it("값이 2개보다 적으면 빈 문자열이에요", () => {
    expect(trendLine([])).toBe("");
    expect(trendLine([500])).toBe("");
  });
});
