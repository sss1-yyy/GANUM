/** Figma 차트 크기와, 선이 위아래로 움직이는 범위 */
export const CHART_WIDTH = 281;
export const CHART_HEIGHT = 96;
const LINE_TOP = 12;
const LINE_BOTTOM = 74;

/**
 * 값들을 Figma 차트 안의 좌표("x,y x,y …")로 바꿔요. 값이 모두 같으면 가운데 가로선이에요.
 * 값이 2개보다 적으면 선을 그릴 수 없어 빈 문자열을 돌려줘요.
 */
export function trendLine(values: number[]): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const range = Math.max(...values) - min;
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * CHART_WIDTH;
      const ratio = range === 0 ? 0.5 : (value - min) / range;
      const y = LINE_BOTTOM - ratio * (LINE_BOTTOM - LINE_TOP);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
