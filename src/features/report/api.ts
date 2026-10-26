import { apiGet, apiPost, pollUntilDone } from "@/shared/api";
import type { ListData } from "@/shared/api";
import type { Report, ReportKind, ReportListItem } from "./types";

// REPORT-01 · 생성 요청 (202, QUEUED)
export const createReport = (kind: ReportKind) =>
  apiPost<{ id: string; status: "QUEUED" }>("/reports", { kind });

// REPORT-03 · 상세·생성 상태
export const getReport = (reportId: string, signal?: AbortSignal) =>
  apiGet<Report>(`/reports/${reportId}`, { signal });

/** [명세 외] 이전 레포트 목록 */
export const listReports = () => apiGet<ListData<ReportListItem>>("/reports");

/** 생성 후 SUCCEEDED/FAILED 가 될 때까지 기다립니다. */
export async function createReportAndWait(kind: ReportKind, signal?: AbortSignal): Promise<Report> {
  const created = await createReport(kind);
  const id = created.data.id;
  const done = await pollUntilDone(async () => (await getReport(id, signal)).data, { signal });
  return done;
}

export const reportKeys = {
  list: ["reports", "list"] as const,
  detail: (id: string) => ["reports", "detail", id] as const,
};
