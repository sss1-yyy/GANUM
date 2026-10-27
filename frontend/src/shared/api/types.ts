/**
 * API 명세서(Notion "GANUM API 명세서 v0.2") 의 공통 규칙을 그대로 옮긴 타입입니다.
 * - 성공: { data, meta? }
 * - 목록: data = { items, nextCursor }
 * - 오류: { error: { code, message, fields? } }
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiSource = "MOCK" | "LIVE" | "MIXED";

export interface ApiMeta {
  source: ApiSource;
  /** 데이터 기준 시각(RFC3339). 모르면 null */
  asOf: string | null;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ListData<T> {
  items: T[];
  /** null 이면 마지막 페이지 */
  nextCursor: string | null;
}

export interface ApiErrorField {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    fields?: ApiErrorField[];
  };
}

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

/** 비동기 생성 API(레포트·시뮬레이션) 공통 상태 */
export type JobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
