import type { SeriesPoint } from "./types";

/**
 * "가장 크게 떨어졌을 때": 투자하는 동안 넣은 원금(cumulativeInvested) 대비 평가금액이
 * 가장 많이 줄었던 순간의 손실률(%). 한 번도 원금 아래로 내려가지 않았으면 0.
 * API 에 없는 값이라 series 로 화면에서 계산해요. (docs/figma-api-gaps.md)
 */
export function maxDrawdownPercent(series: SeriesPoint[]): number {
  let worst = 0;
  for (const point of series) {
    if (point.cumulativeInvested <= 0) continue;
    const loss = (point.value - point.cumulativeInvested) / point.cumulativeInvested;
    if (loss < worst) worst = loss;
  }
  // 표시용 값이라 소수 첫째 자리까지만 남겨요 (-0 은 0 으로)
  return Math.round(worst * 1000) / 10 || 0;
}
