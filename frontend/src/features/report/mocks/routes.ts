import { MOCK_NOW } from "@/mocks/clock";
import {
  accepted,
  bodyAsObject,
  fail,
  listOf,
  notFound,
  ok,
  validationError,
} from "@/mocks/helpers";
import { statusForReadCount } from "@/mocks/shared/jobs";
import { buildPortfolio } from "@/mocks/shared/paper";
import { chargeTokens } from "@/mocks/shared/usage";
import { getAssetSummary } from "@/mocks/shared/assets";
import { profileState } from "@/mocks/shared/user";
import { mockState, nextMockId } from "@/mocks/store";
import type { MockRoute } from "@/mocks/types";
import type { Report, ReportKind, ReportListItem } from "../types";

interface StoredReport {
  report: Report;
  readCount: number;
  /** 목록 카드에 보이는 제목(없으면 첫 번째 조언 제목) */
  headline?: string;
}
const store = () => mockState<{ reports: StoredReport[] }>("reports", () => ({ reports: seed() }));

function financialBody(createdAt: string): Omit<Report, "id" | "kind" | "status" | "createdAt"> {
  return {
    summary: {
      totalAssets: getAssetSummary().totalAssets,
      totalDebt: 3_000_000,
      monthlyIncome: 2_300_000,
      monthlyExpense: 1_700_000,
      monthlySurplus: 600_000,
    },
    allocation: [
      { category: "CASH", weightPercent: 40, reason: "급할 때 쓸 비상금을 먼저 채워요 (예시)" },
      { category: "DEPOSIT", weightPercent: 45, reason: "정기 적금으로 목돈을 만들어요 (예시)" },
      {
        category: "STOCK",
        weightPercent: 15,
        reason: "성향에 맞는 범위에서 소액으로 시작해요 (예시)",
      },
    ],
    risks: ["비상금이 생활비 3개월치보다 적어요.", "카드 할부 잔액의 이자 부담을 확인해 보세요."],
    priceChangeReasons: [],
    advice: [
      {
        title: "비상금 통장부터 만들어요",
        description: "비상금이 80만 원(생활비 0.5개월치)이에요. 3개월치를 목표로 모아요.",
        considerations: ["비상금이 충분해지면 적금 비중을 늘릴 수 있어요."],
      },
      {
        title: "월세 지원 신청 마감이 D-12예요",
        description: "청년 월세 지원은 월 20만 원까지 받을 수 있어요.",
        considerations: ["예상하지 못한 지출을 함께 고려하세요."],
      },
      {
        title: "카드 할부 잔액을 확인해요",
        description: "부채 300만 원 중 이자가 큰 것부터 줄이면 부담이 덜해요.",
        considerations: ["중도 상환 수수료가 있는지 확인하세요."],
      },
    ],
    sources: [{ title: "사용자 입력 재정정보", url: null, asOf: createdAt }],
    limitations: [
      "입력하신 재정 정보와 샘플 데이터 기준의 예시예요.",
      "자산 배분은 설명용 가상 예시이며 개인별 검토가 필요해요.",
    ],
    errorCode: null,
  };
}

function seed(): StoredReport[] {
  // 목록 카드의 한 줄 제목은 Figma 목록 화면에 적힌 문구예요(상세 조언 제목과는 별개).
  const make = (id: string, createdAt: string, headline: string): StoredReport => ({
    readCount: 99,
    headline,
    report: { id, kind: "FINANCIAL", status: "SUCCEEDED", createdAt, ...financialBody(createdAt) },
  });
  // 최신순 (Figma: 10월 8일·최신, 9월 12일, 8월 3일)
  return [
    make("report_1008", "2026-10-08T10:00:00+09:00", "비상금부터 만들고 월세 지원을 신청해요"),
    make("report_0912", "2026-09-12T10:00:00+09:00", "카드 할부 잔액을 먼저 줄여요"),
    make("report_0803", "2026-08-03T10:00:00+09:00", "월 저축 목표를 50만 원으로 정해요"),
  ];
}

export const reportMockRoutes: MockRoute[] = [
  // [명세 외] 이전 레포트 목록
  {
    method: "GET",
    path: "/reports",
    handler: (request) => {
      const items: ReportListItem[] = store().reports.map(({ report, readCount, headline }) => ({
        id: report.id,
        kind: report.kind,
        status: readCount > 1 ? "SUCCEEDED" : statusForReadCount(readCount),
        headlines: [headline ?? report.advice[0]?.title ?? ""],
        createdAt: report.createdAt,
      }));
      return listOf(items, request);
    },
  },

  // REPORT-01
  {
    method: "POST",
    path: "/reports",
    handler: (request) => {
      const kind = bodyAsObject(request)?.kind;
      if (kind !== "FINANCIAL" && kind !== "PAPER") {
        return validationError([{ field: "kind", message: "FINANCIAL 또는 PAPER 이어야 해요." }]);
      }
      if (kind === "FINANCIAL" && !profileState().latest) {
        // 명세: 409 PROFILE_INCOMPLETE — 성향 진단 전이면 레포트를 만들 수 없다고 가정 (확정 필요)
        return fail(409, "PROFILE_INCOMPLETE", "투자 성향 진단을 먼저 해주세요.");
      }
      if (!chargeTokens("REPORT")) return fail(409, "TOKEN_INSUFFICIENT", "이용권이 부족해요.");
      const id = nextMockId("report");
      const report: Report =
        kind === "FINANCIAL"
          ? { id, kind, status: "QUEUED", createdAt: MOCK_NOW, ...financialBody(MOCK_NOW) }
          : paperReport(id, MOCK_NOW);
      store().reports.unshift({ report, readCount: 0 });
      return accepted({ id, status: "QUEUED" });
    },
  },

  // REPORT-03
  {
    method: "GET",
    path: "/reports/:reportId",
    handler: (request) => {
      const stored = store().reports.find((item) => item.report.id === request.params.reportId);
      if (!stored) return notFound("레포트를 찾을 수 없어요.");
      const status = statusForReadCount(stored.readCount);
      stored.readCount += 1;
      if (status !== "SUCCEEDED") {
        return ok(
          {
            ...stored.report,
            status,
            summary: null,
            allocation: [],
            risks: [],
            advice: [],
            sources: [],
            limitations: [],
          },
          true,
        );
      }
      return ok({ ...stored.report, status }, true);
    },
  },
];

function paperReport(id: string, createdAt: string): Report {
  const paper = buildPortfolio();
  return {
    id,
    kind: "PAPER" as ReportKind,
    status: "QUEUED",
    createdAt,
    summary: {
      totalValue: paper.totalValue,
      profitLoss: paper.profitLoss,
      returnPercent: paper.returnPercent,
    },
    allocation: paper.allocation.map((a) => ({
      category: a.type,
      weightPercent: a.weightPercent,
      reason: "현재 모의 포트폴리오 비중이에요.",
    })),
    risks: ["보유 종목이 일부 종목에 몰려 있는지 확인해 보세요."],
    priceChangeReasons: [],
    advice: [
      {
        title: "한 종목에 몰리지 않게 나눠요",
        description: "비중이 큰 종목은 일부를 나누는 방법이 있어요.",
        considerations: ["성향에 맞는 변동성 범위를 정해 보세요."],
      },
    ],
    sources: [{ title: "모의투자 계좌", url: null, asOf: createdAt }],
    limitations: ["가상 거래 기준이며 실제 수익을 보장하지 않아요."],
    errorCode: null,
  };
}
