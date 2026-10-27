import { API_BASE_URL, USE_MOCK } from "./config";
import { ApiError } from "./error";
import { toApiResponse } from "./response";
import { getAccessToken, notifyUnauthorized } from "./token";
import type { ApiResponse, HttpMethod, QueryParams } from "./types";

export interface RequestOptions {
  query?: QueryParams;
  body?: unknown;
  /** POST /paper/orders 처럼 필수인 API 에서만 사용 */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

function buildQueryString(query?: QueryParams): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

/**
 * API 요청의 단일 진입점입니다. 기능 코드에서 fetch 를 직접 쓰지 말고 apiGet/apiPost... 를 사용하세요.
 * path 는 "/api/v1" 뒤의 경로만 적습니다. 예: apiGet("/home")
 */
export async function apiRequest<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  if (USE_MOCK) {
    // 목 모드일 때만 목 서버 코드가 불려옵니다. (운영 빌드에는 포함되지 않음)
    const { handleMockRequest } = await import("@/mocks/server");
    const result = await handleMockRequest({
      method,
      path,
      query: options.query,
      body: options.body,
      headers: options.idempotencyKey ? { "idempotency-key": options.idempotencyKey } : {},
      signal: options.signal,
    });
    try {
      return toApiResponse<T>(result.status, result.body);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) notifyUnauthorized();
      throw error;
    }
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}${buildQueryString(options.query)}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "NETWORK_ERROR", "네트워크 연결을 확인해 주세요.");
  }

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  try {
    return toApiResponse<T>(response.status, json);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) notifyUnauthorized();
    throw error;
  }
}

export const apiGet = <T>(path: string, options?: Omit<RequestOptions, "body">) =>
  apiRequest<T>("GET", path, options);

export const apiPost = <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
  apiRequest<T>("POST", path, { ...options, body });

export const apiPut = <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
  apiRequest<T>("PUT", path, { ...options, body });

export const apiPatch = <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "body">) =>
  apiRequest<T>("PATCH", path, { ...options, body });

export const apiDelete = <T>(path: string, options?: Omit<RequestOptions, "body">) =>
  apiRequest<T>("DELETE", path, options);
