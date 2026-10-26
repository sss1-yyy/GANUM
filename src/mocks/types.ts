import type { HttpMethod, QueryParams } from "@/shared/api/types";

/** 목 서버로 들어오는 요청 */
export interface MockRequest {
  method: HttpMethod;
  /** "/api/v1" 뒤의 경로 (쿼리 제외). 예: "/instruments/ins_005930" */
  path: string;
  /** 경로 파라미터. 예: "/instruments/:instrumentId" → { instrumentId: "ins_005930" } */
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  /** 헤더 이름은 소문자로 전달됩니다. */
  headers: Record<string, string>;
}

export interface MockResponse {
  status: number;
  body: unknown;
}

export type MockHandler = (request: MockRequest) => MockResponse | Promise<MockResponse>;

export interface MockRoute {
  method: HttpMethod;
  /** 명세서의 경로 그대로. 변수는 :이름 으로 적습니다. 예: "/reports/:reportId" */
  path: string;
  handler: MockHandler;
}

/** apiRequest 가 목 서버에 넘기는 입력 */
export interface MockRequestInput {
  method: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}
