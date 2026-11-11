import { MOCK_NOW } from "@/mocks/clock";
import { bodyAsObject, fail, created, ok, validationError } from "@/mocks/helpers";
import { nextMockId } from "@/mocks/store";
import { profileState } from "@/mocks/shared/user";
import type { MockRoute } from "@/mocks/types";
import type { InvestmentProfile } from "@/shared/types";
import {
  MBTI_COPY,
  MOCK_QUESTIONNAIRE_VERSION,
  MOCK_QUESTIONS,
  TYPE_LABEL,
  optionScore,
  typeCode,
} from "./questionnaire";

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
      // 축별 점수 합 (선택지 점수 +2·+1·-1·-2 를 문항 2개씩 더해요)
      const sums = { IE: 0, SN: 0, TF: 0, JP: 0 };
      for (const answer of answers) {
        const scored =
          answer.questionId && answer.optionId
            ? optionScore(answer.questionId, answer.optionId)
            : null;
        if (!answer.questionId || scored === null || seen.has(answer.questionId)) {
          return fail(422, "INVALID_ANSWERS", "답변이 올바르지 않아요.");
        }
        seen.add(answer.questionId);
        sums[scored.axis] += scored.score;
      }
      if (seen.size !== MOCK_QUESTIONS.length) {
        return fail(422, "INVALID_ANSWERS", "모든 문항에 답해 주세요.");
      }

      // 4글자 유형(예: ESFJ) → 캐릭터(신중형·균형형·자유형·도전형)
      const copy = MBTI_COPY[typeCode(sums)];
      const profile: InvestmentProfile = {
        id: nextMockId("profile"),
        questionnaireVersion: MOCK_QUESTIONNAIRE_VERSION,
        type: copy.type,
        typeLabel: TYPE_LABEL[copy.type],
        description: copy.description,
        guides: copy.guides,
        createdAt: MOCK_NOW,
      };
      profileState().latest = profile;
      return created(profile);
    },
  },
];
