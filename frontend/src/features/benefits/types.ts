import type { Benefit, EligibilityStatus } from "@/shared/types";

// BENEFIT-02
export interface BenefitDetail {
  benefit: Benefit;
  requirements: string[];
  supportDescription: string;
  applicationSteps: string[];
  requiredDocuments: string[];
  applicationUrl: string | null;
  institutions: Array<{ id: string; name: string; applicationUrl: string | null }>;
  eligibility: { status: EligibilityStatus; reasons: string[]; missingFields: string[] };
  cautions: string[];
}
