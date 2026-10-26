import { mockDateAfter } from "../clock";
import { mockState } from "../store";
import type { AssetSummary, Benefit, Goal, InvestmentProfile, User } from "@/shared/types";

/** 로그인한 사용자 (Figma 의 "서연님") */
export const MOCK_USER: User = {
  id: "user_demo_01",
  nickname: "서연",
  onboardingCompleted: true,
};

/**
 * 실제 자산 요약 (ASSET-01). Figma 내 자산 · 연결 후 화면의 값입니다.
 * 합계 21,000,000원 = 예적금 11,000,000 + 증권 5,300,000 + 입출금 3,500,000 + 코인 1,200,000
 */
export const MOCK_ASSET_SUMMARY: AssetSummary = {
  totalAssets: 21_000_000,
  totalDebt: 0,
  netAssets: 21_000_000,
  monthlyChangeAmount: 400_000,
  monthlyChangePercent: 1.9,
  categories: [
    { type: "DEPOSIT", amount: 11_000_000, weightPercent: 52.4 },
    { type: "STOCK", amount: 5_300_000, weightPercent: 25.2 },
    { type: "CASH", amount: 3_500_000, weightPercent: 16.7 },
    { type: "CRYPTO", amount: 1_200_000, weightPercent: 5.7 },
  ],
  connectionStatus: "CONNECTED",
};

/** 금융 목표 (GOAL-01). Figma 모의투자 화면의 "목표 15,000,000원" 을 사용합니다. */
export function getMockGoal(): Goal | null {
  return mockState<{ goal: Goal | null }>("goal", () => ({
    goal: {
      id: "goal_demo_01",
      title: "목돈 만들기",
      targetAmount: 15_000_000,
      targetDate: mockDateAfter(365),
      currentAmount: 10_034_002,
      progressPercent: 66.9,
    },
  })).goal;
}

export function setMockGoal(goal: Goal): void {
  mockState<{ goal: Goal | null }>("goal", () => ({ goal })).goal = goal;
}

/** 투자 성향 진단 결과 저장소. 처음에는 "미진단(null)" 입니다. (Figma 홈: "내 투자 성향을 진단 해 보세요") */
export const profileState = () =>
  mockState<{ latest: InvestmentProfile | null }>("investment-profile", () => ({ latest: null }));

/**
 * 청년 혜택 6개 (BENEFIT-01). 순서·제목·금액·D-day 는 Figma 혜택 목록 화면 기준입니다.
 * D-day 는 목데이터의 "오늘"(2026-10-25) 기준으로 계산됩니다.
 */
function benefit(
  id: string,
  title: string,
  summary: string,
  category: Benefit["category"],
  status: Benefit["applicationStatus"],
  deadlineInDays: number | null,
  eligibilityStatus: Benefit["eligibilityStatus"] = "LIKELY_ELIGIBLE",
): Benefit {
  return {
    id,
    title,
    summary,
    category,
    applicationStatus: status,
    deadline: deadlineInDays === null ? null : `${mockDateAfter(deadlineInDays)}T23:59:59+09:00`,
    eligibilityStatus,
    sourceUrl: null,
    updatedAt: "2026-10-20T09:00:00+09:00",
  };
}

export const MOCK_BENEFITS: Benefit[] = [
  benefit("ben_youth_leap", "청년도약계좌", "월 최대 70만 원", "SAVING", "OPEN", 12, "NEEDS_INFO"),
  benefit("ben_youth_rent", "청년 월세 지원", "월 최대 20만 원", "HOUSING", "OPEN", 30),
  benefit("ben_transit", "대중교통비 환급", "월 최대 5만 원", "OTHER", "ALWAYS", null),
  benefit("ben_culture", "청년 문화패스", "연 15만 원", "OTHER", "OPEN", 45),
  benefit(
    "ben_housing_savings",
    "청년주택드림청약통장",
    "최대 연 4.5% 우대금리",
    "SAVING",
    "OPEN",
    23,
  ),
  benefit("ben_learning_card", "국민내일배움카드", "훈련비 최대 500만 원", "EDUCATION", "OPEN", 60),
];
