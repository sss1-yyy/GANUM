import { describe, expect, it } from "vitest";
import {
  changeTone,
  daysUntil,
  formatArrowPercent,
  formatDDay,
  formatDotDate,
  formatKRW,
  formatManWon,
  formatMonthDay,
  formatSignedKRW,
  formatSignedPercent,
} from "./format";

describe("format", () => {
  it("금액에 천 단위 쉼표와 '원'을 붙인다", () => {
    expect(formatKRW(1841000)).toBe("1,841,000원");
    expect(formatKRW(0)).toBe("0원");
  });

  it("만 원으로 떨어지면 줄여서 보여준다", () => {
    expect(formatManWon(400000)).toBe("40만 원");
    expect(formatManWon(12000000)).toBe("1,200만 원");
    expect(formatManWon(5000)).toBe("5,000원");
    expect(formatManWon(15000)).toBe("15,000원");
  });

  it("등락률에 부호를 붙인다", () => {
    expect(formatSignedPercent(1.3)).toBe("+1.3%");
    expect(formatSignedPercent(-4.6)).toBe("-4.6%");
    expect(formatSignedPercent(0)).toBe("0.0%");
    expect(formatSignedPercent(null)).toBe("-");
  });

  it("화살표 표기", () => {
    expect(formatArrowPercent(1.5)).toBe("▲ 1.5%");
    expect(formatArrowPercent(-0.6)).toBe("▼ 0.6%");
  });

  it("부호 포함 금액", () => {
    expect(formatSignedKRW(240000)).toBe("+240,000원");
    expect(formatSignedKRW(-17000)).toBe("-17,000원");
  });

  it("등락 방향", () => {
    expect(changeTone(2)).toBe("up");
    expect(changeTone(-2)).toBe("down");
    expect(changeTone(0)).toBe("flat");
    expect(changeTone(null)).toBe("flat");
  });

  it("날짜 표기", () => {
    expect(formatMonthDay("2026-10-08")).toBe("10월 8일");
    expect(formatMonthDay("2026-10-08T09:00:00+09:00")).toBe("10월 8일");
    expect(formatDotDate("2026-08-15")).toBe("2026.08.15");
  });

  it("D-day 계산", () => {
    expect(daysUntil("2026-11-06", "2026-10-25")).toBe(12);
    expect(formatDDay(12)).toBe("D-12");
    expect(formatDDay(0)).toBe("D-DAY");
    expect(formatDDay(-3)).toBe("마감");
  });
});
