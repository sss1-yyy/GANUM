import { MOCK_TODAY } from "../clock";

export interface PricePoint {
  date: string;
  close: number;
  volume: number;
}

function toUtc(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function toDateString(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** 문자열을 항상 같은 숫자로 바꿉니다 (종목마다 다른 모양의 차트를 만들기 위함) */
function seedOf(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) % 9973;
  return hash;
}

/**
 * 종목의 가짜 가격 흐름. 같은 입력이면 항상 같은 결과이고,
 * 마지막 날(오늘)의 종가는 현재가(currentPrice)와 같습니다.
 */
export function generatePrices(
  instrumentId: string,
  currentPrice: number,
  from: string,
  to: string,
  interval: "DAY" | "WEEK" | "MONTH",
): PricePoint[] {
  const stepDays = interval === "DAY" ? 1 : interval === "WEEK" ? 7 : 30;
  const seed = seedOf(instrumentId);
  const end = Math.min(toUtc(to), toUtc(MOCK_TODAY));
  const start = toUtc(from);
  if (end < start) return [];

  const points: PricePoint[] = [];
  for (let ms = start; ms <= end; ms += stepDays * 86_400_000) {
    const daysFromToday = Math.round((toUtc(MOCK_TODAY) - ms) / 86_400_000);
    const wave =
      Math.sin((daysFromToday + seed) / 2.7) * 0.012 + Math.cos((daysFromToday + seed) / 9) * 0.02;
    const trend = daysFromToday * 0.0002;
    const raw = currentPrice * (1 + wave - trend);
    const close = daysFromToday === 0 ? currentPrice : roundToTick(raw);
    points.push({
      date: toDateString(ms),
      close,
      volume: 100_000 + ((seed + daysFromToday * 7919) % 50_000),
    });
  }
  return points;
}

function roundToTick(price: number): number {
  const tick = price >= 500_000 ? 1000 : price >= 100_000 ? 500 : price >= 50_000 ? 100 : 50;
  return Math.round(price / tick) * tick;
}
