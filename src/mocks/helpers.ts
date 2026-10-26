import type { ApiMeta } from "@/shared/api/types";
import { MOCK_NOW } from "./clock";
import type { MockRequest, MockResponse } from "./types";

export const mockMeta = (): ApiMeta => ({ source: "MOCK", asOf: MOCK_NOW });

/** 200 OK. withMeta 가 true 면 meta{source:"MOCK"} 를 붙입니다. (자산·시세·분석 API) */
export function ok<T>(data: T, withMeta = false): MockResponse {
  return { status: 200, body: withMeta ? { data, meta: mockMeta() } : { data } };
}

export function created<T>(data: T, withMeta = false): MockResponse {
  return { status: 201, body: withMeta ? { data, meta: mockMeta() } : { data } };
}

export function accepted<T>(data: T): MockResponse {
  return { status: 202, body: { data } };
}

/** 명세서 공통 오류 형식 */
export function fail(
  status: number,
  code: string,
  message: string,
  fields?: Array<{ field: string; message: string }>,
): MockResponse {
  return { status, body: { error: { code, message, ...(fields ? { fields } : {}) } } };
}

export const notFound = (message = "찾을 수 없어요."): MockResponse =>
  fail(404, "NOT_FOUND", message);

export const validationError = (
  fields: Array<{ field: string; message: string }>,
  message = "입력값을 확인해 주세요.",
): MockResponse => fail(422, "VALIDATION_ERROR", message, fields);

/** 목록 응답. cursor 는 "시작 위치(숫자 문자열)", limit 기본 20 · 최대 100 */
export function listOf<T>(items: T[], request: MockRequest, withMeta = false): MockResponse {
  const limit = Math.min(Math.max(Number(request.query.limit ?? 20) || 20, 1), 100);
  const start = Math.max(Number(request.query.cursor ?? 0) || 0, 0);
  const page = items.slice(start, start + limit);
  const next = start + limit < items.length ? String(start + limit) : null;
  return ok({ items: page, nextCursor: next }, withMeta);
}

/** 요청 본문을 객체로 읽습니다. 형식이 틀리면 null */
export function bodyAsObject(request: MockRequest): Record<string, unknown> | null {
  const body = request.body;
  if (body && typeof body === "object" && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }
  return null;
}

/** 소수 첫째 자리까지 "버림" (예: 2.4506 → 2.4). 서버의 실제 반올림 정책은 미정이라 목에서는 버림으로 통일 */
export function truncPercent(value: number): number {
  return Math.trunc(value * 10) / 10;
}
