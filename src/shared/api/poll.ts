import { POLL_INTERVAL_MS } from "./config";
import { ApiError } from "./error";
import type { JobStatus } from "./types";

export interface PollOptions {
  intervalMs?: number;
  /** 이 시간 안에 끝나지 않으면 POLL_TIMEOUT 오류 */
  timeoutMs?: number;
  signal?: AbortSignal;
  /** 매 조회마다 호출 (진행 표시용) */
  onTick?: (status: JobStatus) => void;
}

const TERMINAL: JobStatus[] = ["SUCCEEDED", "FAILED"];

function wait(ms: number, signal?: AbortSignal): Promise<void> {
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

/**
 * 명세서의 비동기 생성 규칙(202 → GET 반복 조회 → SUCCEEDED/FAILED 에서 중단)을 구현합니다.
 * FAILED 도 HTTP 200 으로 오므로, 호출한 쪽에서 result.status 를 확인하세요.
 */
export async function pollUntilDone<T extends { status: JobStatus }>(
  fetcher: () => Promise<T>,
  options: PollOptions = {},
): Promise<T> {
  const { intervalMs = POLL_INTERVAL_MS, timeoutMs = 90_000, signal, onTick } = options;
  const startedAt = Date.now();

  for (;;) {
    const result = await fetcher();
    onTick?.(result.status);
    if (TERMINAL.includes(result.status)) return result;
    if (Date.now() - startedAt > timeoutMs) {
      throw new ApiError(
        0,
        "POLL_TIMEOUT",
        "처리 시간이 너무 오래 걸려요. 잠시 후 다시 확인해 주세요.",
      );
    }
    await wait(intervalMs, signal);
  }
}
