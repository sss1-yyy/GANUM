import { apiGet } from "@/shared/api";
import type { HomeDashboard } from "./types";

// HOME-01 · 홈 대시보드
export const getHome = (signal?: AbortSignal) => apiGet<HomeDashboard>("/home", { signal });

export const homeKeys = {
  dashboard: ["home", "dashboard"] as const,
};
