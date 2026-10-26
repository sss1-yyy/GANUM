import { ok, notFound, listOf } from "@/mocks/helpers";
import { MOCK_BENEFITS } from "@/mocks/shared/user";
import type { MockRoute } from "@/mocks/types";
import type { BenefitDetail } from "../types";

const YOUTH_BANKS = [
  "IBK기업",
  "KB국민",
  "NH농협",
  "iM뱅크",
  "경남",
  "광주",
  "부산",
  "신한",
  "우리",
  "전북",
  "하나",
];

/**
 * 혜택 상세 목데이터.
 * 청년도약계좌만 Figma 에 자세히 있고(금리·한도·11개 은행·신청 3단계·서류 3개), 나머지는 같은 모양의 예시 내용이에요.
 * 공식 신청 링크는 데모에서 null 입니다. (명세: "데모 null")
 */
const DETAILS: Record<string, Omit<BenefitDetail, "benefit">> = {
  ben_youth_leap: {
    requirements: [
      "나이: 만 19~34세",
      "소득: 개인 소득 요건 충족",
      "가구 소득: 연 6,000만 원 이하",
    ],
    supportDescription:
      "가입 기간 5년(60개월) · 금리 기본 4.5%, 최대 6.0% · 월 최대 70만 원 납입 · 정부기여금 월 최대 2.4만 원 · 이자소득 비과세",
    applicationSteps: [
      "자격 조회: 나이·소득을 확인해 가입할 수 있는지 바로 알아봐요.",
      "은행 앱 접속: 청년도약계좌를 판매하는 은행 앱을 열고 메뉴를 찾아요.",
      "상품 가입: 월 납입액과 만기를 정하고 가입하면 끝이에요.",
    ],
    requiredDocuments: [
      "본인 명의 휴대폰 (인증용)",
      "소득 확인 서류 (소득 심사용)",
      "신분증 (본인 확인용)",
    ],
    applicationUrl: null,
    institutions: YOUTH_BANKS.map((name, i) => ({
      id: `bank_${i + 1}`,
      name,
      applicationUrl: null,
    })),
    eligibility: {
      status: "NEEDS_INFO",
      reasons: ["나이: 만 19~34세 → 충족해요", "소득: 확인이 필요해요"],
      missingFields: ["가구 소득"],
    },
    cautions: ["중도 해지하면 일부 혜택이 제한돼요.", "최종 신청 자격은 공식 안내에서 확인하세요."],
  },
};

function generic(title: string, summary: string): Omit<BenefitDetail, "benefit"> {
  return {
    requirements: ["만 19~34세 청년", "소득·거주지 요건은 공식 안내를 확인하세요 (예시)"],
    supportDescription: `${title}: ${summary} (예시 내용)`,
    applicationSteps: ["자격 조회", "신청서 작성", "결과 확인"],
    requiredDocuments: ["신분증 (본인 확인용)"],
    applicationUrl: null,
    institutions: [],
    eligibility: {
      status: "LIKELY_ELIGIBLE",
      reasons: ["입력하신 나이·소득 기준으로 대상일 가능성이 있어요."],
      missingFields: [],
    },
    cautions: ["최종 신청 자격은 공식 안내에서 확인하세요."],
  };
}

export const benefitsMockRoutes: MockRoute[] = [
  // BENEFIT-01
  {
    method: "GET",
    path: "/benefits",
    handler: (request) => {
      const { category, status, matchedOnly } = request.query;
      let items = MOCK_BENEFITS.slice();
      if (category) items = items.filter((b) => b.category === category);
      if (status) items = items.filter((b) => b.applicationStatus === status);
      if (matchedOnly === "true")
        items = items.filter((b) => b.eligibilityStatus === "LIKELY_ELIGIBLE");
      return listOf(items, request);
    },
  },

  // BENEFIT-02
  {
    method: "GET",
    path: "/benefits/:benefitId",
    handler: (request) => {
      const benefit = MOCK_BENEFITS.find((b) => b.id === request.params.benefitId);
      if (!benefit) return notFound("혜택을 찾을 수 없어요.");
      const detail = DETAILS[benefit.id] ?? generic(benefit.title, benefit.summary);
      return ok({
        benefit,
        ...detail,
        eligibility: { ...detail.eligibility, status: benefit.eligibilityStatus },
      });
    },
  },
];
