import type { SimulationKind } from "./types";

/** 세 질문을 보여주는 순서 (결과 화면도 이 순서) */
export const KIND_ORDER: SimulationKind[] = ["TIMING", "DIVERSIFICATION", "RECURRING"];

export const QUESTION_TITLE: Record<SimulationKind, string> = {
  TIMING: "그때 투자했다면 얼마가 됐을까?",
  DIVERSIFICATION: "나눠 투자했다면 달랐을까?",
  RECURRING: "매달 조금씩 투자했다면?",
};

/**
 * Q1·Q2 는 금액을 입력받지 않고 기준 금액으로 계산해요 (팀 결정: 둘 다 100만 원, Q3 만 직접 입력).
 * (docs/figma-api-gaps.md)
 */
export const FIXED_AMOUNT = { TIMING: 1_000_000, DIVERSIFICATION: 1_000_000 } as const;

/** Q1 비교 시점: 고른 날보다 한 달 늦게 샀을 때와 비교해요 (Figma "내 실제" 매수일을 알 수 없어서) */
export const TIMING_COMPARE_MONTHS = 1;

export const DIVERSIFICATION_MAX = 3;

/**
 * 결과 카드 두 칸. API scenarios[0] 이 강조 칸(오른쪽, 보라), scenarios[1] 이 비교 칸(왼쪽, 회색)이에요.
 * short 는 표 머리글에 쓰는 짧은 이름
 */
export const SCENARIO_TITLES: Record<
  SimulationKind,
  { focus: string; focusShort: string; base: string; baseShort: string }
> = {
  TIMING: { focus: "만약", focusShort: "만약", base: "한 달 늦게", baseShort: "한 달 뒤" },
  DIVERSIFICATION: {
    focus: "분산 투자",
    focusShort: "분산",
    base: "한 종목 집중",
    baseShort: "집중",
  },
  RECURRING: {
    focus: "적립식 투자",
    focusShort: "적립식",
    base: "한 번에 투자",
    baseShort: "한 번에",
  },
};
