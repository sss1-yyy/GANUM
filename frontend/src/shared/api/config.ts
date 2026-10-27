/** true 면 서버 대신 src/mocks 의 목데이터로 동작합니다. (.env.local 의 NEXT_PUBLIC_USE_MOCK) */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

/** 실제 백엔드 주소. 명세서에 따라 모든 경로 앞에 /api/v1 이 붙습니다. */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

/** 비동기 작업(레포트·시뮬레이션) 조회 간격. 명세서: 실제 2~5초, 목데이터는 빠르게 */
export const POLL_INTERVAL_MS = USE_MOCK ? 700 : 2500;
