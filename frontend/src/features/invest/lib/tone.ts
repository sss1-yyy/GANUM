import { changeTone, type ChangeTone } from "@/shared/lib/format";

/**
 * 상승 빨강 · 하락 파랑 · 보합 회색.
 * 차트 SVG 는 이 class 를 받아 currentColor 로 선·면 색을 칠해요.
 */
export const TONE_CLASSES: Record<ChangeTone, string> = {
  up: "text-positive",
  down: "text-negative",
  flat: "text-text-muted",
};

export function toneClass(value: number | null | undefined): string {
  return TONE_CLASSES[changeTone(value)];
}
