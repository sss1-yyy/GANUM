import { findRoute } from "./router";
import { fail } from "./helpers";
import { mockRoutes } from "./routes";
import type { MockRequest, MockRequestInput, MockResponse } from "./types";

/** 네트워크 지연 흉내 (ms). 테스트에서는 0 으로 둡니다. */
const LATENCY_MS = Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS ?? 150);

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function stringifyQuery(query: MockRequestInput["query"]): Record<string, string> {
  const result: Record<string, string> = {};
  if (!query) return result;
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    result[key] = String(value);
  }
  return result;
}

/** apiRequest 가 NEXT_PUBLIC_USE_MOCK=true 일 때 호출합니다. 실서버를 흉내 내어 {status, body} 를 돌려줍니다. */
export async function handleMockRequest(input: MockRequestInput): Promise<MockResponse> {
  await delay(LATENCY_MS, input.signal);

  const matched = findRoute(mockRoutes, input.method, input.path);
  if (!matched) {
    return fail(
      404,
      "NOT_FOUND",
      `목데이터가 없는 API예요: ${input.method} ${input.path} (담당 기능의 mocks/routes.ts 에 추가해 주세요)`,
    );
  }

  const request: MockRequest = {
    method: input.method,
    path: input.path,
    params: matched.params,
    query: stringifyQuery(input.query),
    body: input.body,
    headers: input.headers ?? {},
  };

  try {
    return await matched.route.handler(request);
  } catch (error) {
    console.error("[mock] 핸들러에서 오류가 났어요", error);
    return fail(500, "INTERNAL_ERROR", "목 서버 처리 중 오류가 났어요.");
  }
}
