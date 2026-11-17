/** true 면 서버 대신 src/mocks 의 목데이터로 동작합니다. (.env.local 의 NEXT_PUBLIC_USE_MOCK) */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

/** 실제 백엔드 주소. 명세서에 따라 모든 경로 앞에 /api/v1 이 붙습니다. */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

/** 비동기 작업(레포트·시뮬레이션) 조회 간격. 명세서: 실제 2~5초, 목데이터는 빠르게 */
export const POLL_INTERVAL_MS = USE_MOCK ? 700 : 2500;

/**
 * 실서버 모드(NEXT_PUBLIC_USE_MOCK=false)에서도 목데이터로 동작하는 경로예요.
 * 노션 "목데이터, 실제 구현 목록"에서 목데이터 범위로 정한 API 중 백엔드에 없는 것만 적어요.
 * 백엔드가 생기면 해당 줄을 지우는 것만으로 실서버로 전환돼요.
 */
export const MOCK_ONLY_PATH_PREFIXES = [
  "/paper", // 모의투자 (PAPER-01/03/04) — 목데이터 범위
  "/me/goal", // 목표 (모의투자 메인 목표 카드)
  "/investment-profiles", // 투자 성향 진단
];

/** 이 경로는 실서버 대신 목데이터로 처리해야 하는지 */
export function isMockOnlyPath(path: string): boolean {
  return MOCK_ONLY_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
