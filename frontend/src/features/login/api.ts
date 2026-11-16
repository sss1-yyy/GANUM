import { setAccessToken } from "@/shared/api";

/**
 * 카카오로 시작하기.
 * 로그인은 목데이터 범위라 실제 로그인 API 에 연결하지 않아요(팀 결정). 목 모드든 실서버 모드든
 * 누가 언제 눌러도 바로 넘어가요. 백엔드도 토큰과 상관없이 데모 사용자로 처리해요(DemoUserResolver).
 */
export function startKakaoLogin(): void {
  setAccessToken("mock-access-token");
}
