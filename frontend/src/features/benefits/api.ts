import { apiGet } from "@/shared/api";
import type { ListData, QueryParams } from "@/shared/api";
import type { Benefit } from "@/shared/types";
import type { BenefitDetail } from "./types";

// BENEFIT-01 · 청년 혜택 목록
export interface BenefitsQuery extends QueryParams {
  category?: Benefit["category"];
  status?: Benefit["applicationStatus"];
  matchedOnly?: boolean;
}
export const getBenefits = (query?: BenefitsQuery) =>
  apiGet<ListData<Benefit>>("/benefits", { query });

// BENEFIT-02 · 혜택 상세·신청기관
export const getBenefit = (benefitId: string) => apiGet<BenefitDetail>(`/benefits/${benefitId}`);

export const benefitKeys = {
  list: (query?: object) => ["benefits", "list", query ?? {}] as const,
  detail: (id: string) => ["benefits", "detail", id] as const,
};
