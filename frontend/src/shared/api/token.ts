/**
 * 액세스 토큰은 "메모리"에만 보관합니다. (localStorage / sessionStorage / 쿠키에 저장 금지)
 * 새로고침하면 사라지는 것이 정상이며, 로그인 방식이 확정되면 갱신 방법을 이 파일에서만 바꿉니다.
 */
let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

/** 401 응답을 받았을 때 실행할 동작(예: 로그인 화면으로 이동)을 등록합니다. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized(): void {
  clearAccessToken();
  unauthorizedHandler?.();
}
