import type { InvestmentType } from "@/shared/types";

// PROFILE-01 · GET /investment-questionnaires/current
export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  order: number;
  text: string;
  /** [명세 외 제안] 질문 밑 보조 설명(Figma 퀴즈 화면에 있음). 명세에는 없는 필드라 없을 수 있어요. */
  hint?: string;
  options: QuestionOption[];
}

export interface Questionnaire {
  version: string;
  questions: Question[];
}

// PROFILE-02 · POST /investment-profiles
export interface SubmitProfileBody {
  questionnaireVersion: string;
  answers: Array<{ questionId: string; optionId: string }>;
}

export type { InvestmentType };
