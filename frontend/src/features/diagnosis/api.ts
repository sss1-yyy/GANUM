import { apiGet, apiPost } from "@/shared/api";
import type { InvestmentProfile } from "@/shared/types";
import type { Questionnaire, SubmitProfileBody } from "./types";

// PROFILE-01 · 진단 문항 조회
export const getQuestionnaire = (signal?: AbortSignal) =>
  apiGet<Questionnaire>("/investment-questionnaires/current", { signal });

// PROFILE-02 · 진단 제출 (201). 서버가 채점합니다.
export const submitProfile = (body: SubmitProfileBody) =>
  apiPost<InvestmentProfile>("/investment-profiles", body);

export const diagnosisKeys = {
  questionnaire: ["investment-questionnaire", "current"] as const,
};
