import type { JobStatus } from "@/shared/api";

/**
 * 비동기 생성 API(레포트·시뮬레이션)의 진행 상태 흉내.
 * 상세를 조회할 때마다 QUEUED → RUNNING → SUCCEEDED 로 한 단계씩 넘어갑니다.
 * (실제 서버는 2~5초 간격으로 조회하라고 명세에 있어요)
 */
export function statusForReadCount(readCount: number): JobStatus {
  if (readCount <= 0) return "QUEUED";
  if (readCount === 1) return "RUNNING";
  return "SUCCEEDED";
}
