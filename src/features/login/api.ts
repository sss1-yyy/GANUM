import { USE_MOCK, setAccessToken } from "@/shared/api";

/**
 * 카카오 로그인 시작.
 * ⚠ API 명세서 v0.2 에는 로그인 API 가 없습니다(로그인 제공자·토큰 발급 정책 미정).
 *   그래서 지금은 목 모드에서만 "로그인된 것처럼" 토큰을 넣고, 실서버 모드에서는 안내만 합니다.
 *   로그인 방식이 정해지면 이 함수만 바꾸면 됩니다.
 */
export async function startKakaoLogin(): Promise<void> {
  if (USE_MOCK) {
    setAccessToken("mock-access-token");
    return;
  }
  throw new Error("LOGIN_NOT_READY");
}
