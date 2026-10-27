import { ApiError } from "./error";
import type { ApiResponse } from "./types";

/** HTTP 상태와 본문을 받아 성공이면 ApiResponse, 실패면 ApiError 를 던집니다. 실서버/목 모두 이 함수를 씁니다. */
export function toApiResponse<T>(status: number, body: unknown): ApiResponse<T> {
  if (status >= 200 && status < 300) {
    const parsed = body as Partial<ApiResponse<T>> | null;
    if (parsed && "data" in parsed) {
      return { data: parsed.data as T, meta: parsed.meta };
    }
    throw new ApiError(status, "INVALID_RESPONSE", "서버 응답 형식이 올바르지 않아요.");
  }
  throw ApiError.fromBody(status, body);
}
