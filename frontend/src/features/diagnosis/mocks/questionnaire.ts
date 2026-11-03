import type { InvestmentType, Question } from "../types";

/**
 * 진단 문항 8개 (목데이터).
 * 1·2·8번은 Figma 문항 그대로이고, 3~7번은 Figma 디자인이 없어 목데이터로 채웠습니다.
 * 실제 문항·채점 기준은 팀에서 확정해야 합니다. (API 명세 §12 "최종 문항·채점 기준")
 */
export const MOCK_QUESTIONNAIRE_VERSION = "mock-2026-10-v1";

interface Draft {
  text: string;
  hint?: string;
  /** 선택지 4개 (위에서부터) 와 각각이 가리키는 성향 */
  options: Array<[string, InvestmentType]>;
}

const DRAFTS: Draft[] = [
  {
    text: "투자금이 10% 줄어들면?",
    hint: "정답은 없어요. 편하게 골라주세요",
    options: [
      ["당황스럽지만, 일단 지켜본다", "BALANCED"],
      ["추가로 더 투자할 기회를 찾아본다", "BOLD"],
      ["손실을 줄이기 위해 바로 정리한다", "CAUTIOUS"],
      ["그때그때 상황을 보고 결정한다", "FREE"],
    ],
  },
  {
    text: "투자를 하려는 가장 큰 이유는?",
    hint: "가장 가까운 걸 하나만 골라주세요",
    options: [
      ["원금을 지키면서 조금씩 불리고 싶다", "CAUTIOUS"],
      ["은행 이자보다 더 벌고 싶다", "BALANCED"],
      ["큰 수익을 노려보고 싶다", "BOLD"],
      ["그때그때 목적이 달라진다", "FREE"],
    ],
  },
  {
    text: "투자 기간은 어느 정도로 생각하세요?",
    options: [
      ["1년 미만", "CAUTIOUS"],
      ["1~3년", "BALANCED"],
      ["3년 이상", "BOLD"],
      ["정해두지 않았어요", "FREE"],
    ],
  },
  {
    text: "월급이 들어오면 가장 먼저 하는 일은?",
    options: [
      ["비상금부터 채워요", "CAUTIOUS"],
      ["저축과 소비를 나눠요", "BALANCED"],
      ["투자 계좌로 옮겨요", "BOLD"],
      ["그때 기분대로 써요", "FREE"],
    ],
  },
  {
    text: "투자 정보는 주로 어디서 얻나요?",
    options: [
      ["은행·증권사 공식 자료", "CAUTIOUS"],
      ["뉴스와 전문가 의견", "BALANCED"],
      ["커뮤니티와 SNS", "BOLD"],
      ["주변 사람의 이야기", "FREE"],
    ],
  },
  {
    text: "한 종목이 하루에 -5% 떨어졌다면?",
    options: [
      ["불안해서 바로 확인해요", "CAUTIOUS"],
      ["이유를 찾아본 뒤 결정해요", "BALANCED"],
      ["싸게 살 기회라고 생각해요", "BOLD"],
      ["신경 쓰지 않아요", "FREE"],
    ],
  },
  {
    text: "투자 경험은 어느 정도예요?",
    options: [
      ["거의 없어요", "CAUTIOUS"],
      ["예적금·펀드 정도", "BALANCED"],
      ["주식을 직접 해봤어요", "BOLD"],
      ["여러 가지를 조금씩 해봤어요", "FREE"],
    ],
  },
  {
    text: "다음 중 마음에 드는 결과는?",
    hint: "실제 돈이라고 생각하고 골라주세요",
    options: [
      ["1년 뒤 +3%, 손실은 거의 없다", "CAUTIOUS"],
      ["1년 뒤 +8% 또는 −8%", "BALANCED"],
      ["1년 뒤 +20% 또는 −20%", "BOLD"],
      ["그때그때 달라질 것 같다", "FREE"],
    ],
  },
];

export const MOCK_QUESTIONS: Question[] = DRAFTS.map((draft, index) => ({
  id: `q${index + 1}`,
  order: index + 1,
  text: draft.text,
  ...(draft.hint ? { hint: draft.hint } : {}),
  options: draft.options.map(([text], optionIndex) => ({
    id: `q${index + 1}_o${optionIndex + 1}`,
    text,
  })),
}));

/** "q3_o2" → 해당 선택지가 가리키는 성향 (없으면 null) */
export function optionType(questionId: string, optionId: string): InvestmentType | null {
  const index = MOCK_QUESTIONS.findIndex((q) => q.id === questionId);
  const draft = DRAFTS[index];
  if (!draft) return null;
  const optionIndex = MOCK_QUESTIONS[index]!.options.findIndex((o) => o.id === optionId);
  return draft.options[optionIndex]?.[1] ?? null;
}

/** 성향별 설명·가이드. (Figma 설명 문구를 참고했지만 최종 문구는 기획 확정 필요) */
export const TYPE_COPY: Record<
  InvestmentType,
  { label: string; description: string; guides: string[] }
> = {
  CAUTIOUS: {
    label: "신중형",
    description: "원금을 지키는 것이 가장 중요한 안정 추구형이에요. 흔들림이 적은 선택을 좋아해요.",
    guides: [
      "비상금을 먼저 채워요",
      "예적금 비중을 높게 유지해요",
      "한 번에 큰 금액을 넣지 않아요",
    ],
  },
  BALANCED: {
    label: "균형형",
    description: "안정과 수익 사이에서 균형을 맞추는 유형이에요. 근거를 확인하고 나눠서 투자해요.",
    guides: [
      "자산을 여러 곳에 나눠요",
      "정기적으로 비중을 점검해요",
      "수익 목표와 손실 한도를 정해요",
    ],
  },
  BOLD: {
    label: "도전형",
    description:
      "더 높은 수익을 위해 변동성을 감수할 수 있는 유형이에요. 기회를 적극적으로 찾아요.",
    guides: [
      "손실 한도를 미리 정해요",
      "한 종목에 집중하지 않아요",
      "충동적인 추가 매수를 조심해요",
    ],
  },
  FREE: {
    label: "자유형",
    description: "상황에 맞춰 유연하게 판단하는 유형이에요. 나만의 기준을 만들면 더 좋아요.",
    guides: [
      "나만의 투자 원칙을 한 줄로 적어요",
      "기록을 남겨 패턴을 살펴봐요",
      "정기 점검일을 정해요",
    ],
  },
};
