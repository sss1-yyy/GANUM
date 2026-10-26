import type { ApiErrorBody, ApiErrorField } from "./types";

/** 서버가 내려준 오류(또는 네트워크 오류)를 하나의 형태로 다루기 위한 클래스 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: ApiErrorField[];

  constructor(status: number, code: string, message: string, fields: ApiErrorField[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  static fromBody(status: number, body: unknown): ApiError {
    const err = (body as Partial<ApiErrorBody> | null)?.error;
    if (err && typeof err.code === "string") {
      return new ApiError(status, err.code, err.message ?? "요청을 처리하지 못했어요.", err.fields);
    }
    return new ApiError(status, "UNKNOWN_ERROR", "요청을 처리하지 못했어요.");
  }

  /** 로그인이 필요하거나 권한이 없는 경우 */
  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
