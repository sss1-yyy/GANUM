/**
 * 목데이터 세계의 "오늘". 화면의 D-day, 기준 시각이 실행할 때마다 달라지지 않도록 고정합니다.
 * (명세서 예시 날짜와 같은 2026-10-25)
 */
export const MOCK_TODAY = "2026-10-25";
export const MOCK_NOW = "2026-10-25T09:00:00+09:00";

/** 오늘로부터 n일 뒤 날짜 (YYYY-MM-DD) */
export function mockDateAfter(days: number): string {
  const [y, m, d] = MOCK_TODAY.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}
