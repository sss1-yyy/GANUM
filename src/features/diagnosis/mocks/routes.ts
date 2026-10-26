import { MOCK_NOW } from "@/mocks/clock";
import { bodyAsObject, fail, created, ok, validationError } from "@/mocks/helpers";
import { nextMockId } from "@/mocks/store";
import { profileState } from "@/mocks/shared/user";
import type { MockRoute } from "@/mocks/types";
import type { InvestmentProfile } from "@/shared/types";
import type { InvestmentType } from "../types";
import { MOCK_QUESTIONNAIRE_VERSION, MOCK_QUESTIONS, TYPE_COPY, optionType } from "./questionnaire";

/** 동점이면 앞에 있는 성향이 이깁니다. (실제 채점 기준은 서버가 정함) */
const TIE_ORDER: InvestmentType[] = ["BALANCED", "CAUTIOUS", "BOLD", "FREE"];

export const diagnosisMockRoutes: MockRoute[] = [
  // PROFILE-01
  {
    method: "GET",
    path: "/investment-questionnaires/current",
    handler: () => ok({ version: MOCK_QUESTIONNAIRE_VERSION, questions: MOCK_QUESTIONS }),
  },

  // PROFILE-02
  {
    method: "POST",
    path: "/investment-profiles",
    handler: (request) => {
      const body = bodyAsObject(request);
      if (!body || typeof body.questionnaireVersion !== "string" || !Array.isArray(body.answers)) {
        return validationError([{ field: "answers", message: "모든 문항에 답해 주세요." }]);
      }
      if (body.questionnaireVersion !== MOCK_QUESTIONNAIRE_VERSION) {
        return fail(
          409,
          "QUESTIONNAIRE_CHANGED",
          "문항이 바뀌었어요. 처음부터 다시 진단해 주세요.",
        );
      }

      const answers = body.answers as Array<{ questionId?: string; optionId?: string }>;
      const seen = new Set<string>();
      const counts: Record<InvestmentType, number> = { CAUTIOUS: 0, BALANCED: 0, BOLD: 0, FREE: 0 };
      for (const answer of answers) {
        const type =
          answer.questionId && answer.optionId
            ? optionType(answer.questionId, answer.optionId)
            : null;
        if (!answer.questionId || type === null || seen.has(answer.questionId)) {
          return fail(422, "INVALID_ANSWERS", "답변이 올바르지 않아요.");
        }
        seen.add(answer.questionId);
        counts[type] += 1;
      }
      if (seen.size !== MOCK_QUESTIONS.length) {
        return fail(422, "INVALID_ANSWERS", "모든 문항에 답해 주세요.");
      }

      const type = TIE_ORDER.reduce((best, candidate) =>
        counts[candidate] > counts[best] ? candidate : best,
      );
      const copy = TYPE_COPY[type];
      const profile: InvestmentProfile = {
        id: nextMockId("profile"),
        questionnaireVersion: MOCK_QUESTIONNAIRE_VERSION,
        type,
        typeLabel: copy.label,
        description: copy.description,
        guides: copy.guides,
        createdAt: MOCK_NOW,
      };
      profileState().latest = profile;
      return created(profile);
    },
  },
];
