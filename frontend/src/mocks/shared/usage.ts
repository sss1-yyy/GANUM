import { mockState } from "../store";

/**
 * 서비스 토큰(이용권) 목데이터. USAGE-01 과 챗봇·레포트·시뮬레이션이 함께 씁니다.
 * ⚠ 지급량·차감량은 명세서에서 "미정"이라 예시 값입니다. (Figma: 시뮬레이션 3회, 레포트 2회 남음)
 */
export const TOKEN_COSTS = { CHAT: 1, REPORT: 3, SIMULATION: 2 } as const;
export type TokenFeature = keyof typeof TOKEN_COSTS;

interface UsageState {
  tokensGranted: number;
  tokensUsed: number;
}

export const usageState = () =>
  mockState<UsageState>("usage", () => ({ tokensGranted: 10, tokensUsed: 4 }));

export const tokenBalance = () => {
  const state = usageState();
  return state.tokensGranted - state.tokensUsed;
};

/** 토큰이 충분하면 차감하고 true, 모자라면 아무것도 안 하고 false */
export function chargeTokens(feature: TokenFeature): boolean {
  const cost = TOKEN_COSTS[feature];
  if (tokenBalance() < cost) return false;
  usageState().tokensUsed += cost;
  return true;
}
