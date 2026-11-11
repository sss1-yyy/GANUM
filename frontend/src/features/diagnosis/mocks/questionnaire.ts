import { type MbtiCode } from "../results";
import type { InvestmentType, Question } from "../types";

/**
 * 진단 문항 8개 (목데이터). 정기회의6 "투자진단성향 데이터" 문항·채점 기준 그대로예요.
 * 실제 문항·채점은 서버가 정해요. (API 명세 §12 "최종 문항·채점 기준")
 */
export const MOCK_QUESTIONNAIRE_VERSION = "mock-2026-11-v2";

/** 4개 축. 문항 2개씩, 점수 합이 + 면 앞 글자, - 면 뒤 글자예요 */
type Axis = "IE" | "SN" | "TF" | "JP";

interface Draft {
  axis: Axis;
  text: string;
  hint?: string;
  /** 선택지 4개 (위에서부터). 점수는 차례로 +2, +1, -1, -2 */
  options: [string, string, string, string];
}

const OPTION_SCORES = [2, 1, -1, -2] as const;

const DRAFTS: Draft[] = [
  {
    axis: "IE",
    text: "월급 외에 100만 원이 생겼어요. 어떻게 할까요?",
    hint: "정답은 없어요. 편하게 골라주세요",
    options: [
      "전부 원금이 보장되는 예금·적금에 넣는다",
      "대부분 안전하게 두고, 일부만 투자한다",
      "대부분 투자하고, 일부만 안전하게 둔다",
      "전부 투자한다",
    ],
  },
  {
    axis: "IE",
    text: "내 투자금이 한 달 만에 10% 줄었어요. 어떻게 할까요?",
    options: [
      "불안해서 바로 팔고 싶다",
      "걱정돼서 투자 비중을 줄일지 고민한다",
      "더 살 기회인지 살펴본다",
      "싸졌다고 생각하고 추가로 산다",
    ],
  },
  {
    axis: "SN",
    text: "이번 달 여윳돈 30만 원이 생겼어요. 어디에 쓸까요?",
    options: [
      "지금 하고 싶은 일에 전부 쓴다",
      "대부분 쓰고, 조금만 모아 둔다",
      "대부분 모으고, 조금만 쓴다",
      "미래를 위해 전부 모은다",
    ],
  },
  {
    axis: "SN",
    text: "투자 목표를 세운다면 언제를 기준으로 잡을까요?",
    options: [
      "올해 안에 쓸 여행·취미 자금",
      "1~2년 안에 쓸 목돈",
      "5~10년 뒤의 목표",
      "10년 이상 걸리는 노후·큰 목표",
    ],
  },
  {
    axis: "TF",
    text: "투자 방법을 고를 때 어느 쪽이 더 끌리나요?",
    options: [
      "오랫동안 많은 사람이 써 온 방법만 쓴다",
      "검증된 방법을 주로 쓰고, 가끔 새로운 걸 본다",
      "새로운 방법을 주로 쓰고, 검증된 방법도 섞는다",
      "새롭고 실험적인 방법을 먼저 써 본다",
    ],
  },
  {
    axis: "TF",
    text: "친구가 요즘 뜨는 새로운 투자 방식을 알려줬어요. 어떻게 할까요?",
    options: [
      "몇 년 더 지켜보고 검증된 뒤에 생각한다",
      "후기와 실적을 충분히 확인한 뒤에 한다",
      "바로 알아보고 일부 금액으로 시작한다",
      "바로 시작한다",
    ],
  },
  {
    axis: "JP",
    text: "투자를 시작하기 전에 어떻게 준비하나요?",
    options: [
      "목표, 금액, 기간, 그만둘 기준까지 미리 정해 둔다",
      "큰 틀은 정하고 세부 내용도 꽤 정해 둔다",
      "대략만 정하고 시작한다",
      "일단 시작하고 하면서 정한다",
    ],
  },
  {
    axis: "JP",
    text: "시장이 갑자기 크게 흔들렸어요. 어떻게 대응할까요?",
    options: [
      "처음 세운 계획을 그대로 지킨다",
      "계획은 지키되, 조금만 조정한다",
      "상황을 보고 계획을 많이 바꾼다",
      "계획보다 그때그때 새로 판단한다",
    ],
  },
];

export const MOCK_QUESTIONS: Question[] = DRAFTS.map((draft, index) => ({
  id: `q${index + 1}`,
  order: index + 1,
  text: draft.text,
  ...(draft.hint ? { hint: draft.hint } : {}),
  options: draft.options.map((text, optionIndex) => ({
    id: `q${index + 1}_o${optionIndex + 1}`,
    text,
  })),
}));

/** "q3_o2" → 그 선택지의 축과 점수 (없으면 null) */
export function optionScore(
  questionId: string,
  optionId: string,
): { axis: Axis; score: number } | null {
  const index = MOCK_QUESTIONS.findIndex((q) => q.id === questionId);
  const draft = DRAFTS[index];
  if (!draft) return null;
  const optionIndex = MOCK_QUESTIONS[index]!.options.findIndex((o) => o.id === optionId);
  const score = OPTION_SCORES[optionIndex];
  return score === undefined ? null : { axis: draft.axis, score };
}

/**
 * 축별 점수 합 → 4글자 유형 코드 (예: "ISTJ").
 * 합이 0 이면 앞 글자(I·S·T·J)로 정해요. Notion 기준에 동점 규칙이 없어 목에서 임시로 정한 값이에요.
 */
export function typeCode(sums: Record<Axis, number>): MbtiCode {
  const pick = (axis: Axis) => (sums[axis] >= 0 ? axis[0] : axis[1]);
  return `${pick("IE")}${pick("SN")}${pick("TF")}${pick("JP")}` as MbtiCode;
}

/** 캐릭터(성향) 이름 */
export const TYPE_LABEL: Record<InvestmentType, string> = {
  CAUTIOUS: "신중형",
  BALANCED: "균형형",
  BOLD: "도전형",
  FREE: "자유형",
};
