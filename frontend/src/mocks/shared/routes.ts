import { MOCK_NOW, MOCK_TODAY, mockDateAfter } from "../clock";
import { bodyAsObject, listOf, notFound, ok, validationError } from "../helpers";
import { mockState } from "../store";
import type { MockRoute } from "../types";
import { INSTRUMENTS, findInstrument, toListItem } from "./instruments";
import { buildPortfolio } from "./paper";
import { getAssetSummary } from "./assets";
import { generatePrices } from "./prices";
import { TOKEN_COSTS, tokenBalance, usageState } from "./usage";
import { MOCK_USER, getMockGoal, profileState, setMockGoal } from "./user";
import type { Goal } from "@/shared/types";

/**
 * 여러 기능이 함께 쓰는 API 의 목 핸들러입니다.
 * USER-01/02/03 · GOAL-01/02 · MARKET-01/02/03 · PAPER-01 · USAGE-01
 */

interface FinancialProfile {
  birthYear: number | null;
  occupation: "STUDENT" | "EMPLOYEE" | "OTHER" | null;
  housingType: "FAMILY" | "RENT" | "OWN" | "OTHER" | null;
  regionCode: string | null;
  monthlyIncome: number | null;
  monthlyExpense: number | null;
  debtAmount: number | null;
  emergencyFund: number | null;
  updatedAt: string;
}

const financialProfile = () =>
  mockState<FinancialProfile>("financial-profile", () => ({
    // Figma 혜택 화면: "만 21세 / 월 240만 원 / 용인"
    birthYear: 2005,
    occupation: "STUDENT",
    housingType: "FAMILY",
    regionCode: "41460",
    monthlyIncome: 2_400_000,
    monthlyExpense: 1_700_000,
    debtAmount: 3_000_000,
    emergencyFund: 800_000,
    updatedAt: MOCK_NOW,
  }));

const OCCUPATIONS = ["STUDENT", "EMPLOYEE", "OTHER"];
const HOUSING = ["FAMILY", "RENT", "OWN", "OTHER"];
const MONEY_FIELDS = ["monthlyIncome", "monthlyExpense", "debtAmount", "emergencyFund"] as const;

export const sharedRoutes: MockRoute[] = [
  // USER-01
  { method: "GET", path: "/me", handler: () => ok(MOCK_USER) },

  // USER-02
  { method: "GET", path: "/me/financial-profile", handler: () => ok(financialProfile()) },

  // USER-03 · 보낸 필드만 수정, null 은 미입력으로 초기화
  {
    method: "PATCH",
    path: "/me/financial-profile",
    handler: (request) => {
      const body = bodyAsObject(request);
      if (!body || Object.keys(body).length === 0) {
        return validationError([{ field: "body", message: "수정할 값을 1개 이상 보내 주세요." }]);
      }
      const errors: Array<{ field: string; message: string }> = [];
      const next = { ...financialProfile() };

      if ("birthYear" in body) {
        const value = body.birthYear;
        if (
          value !== null &&
          (!Number.isInteger(value) || (value as number) < 1900 || (value as number) > 2026)
        ) {
          errors.push({ field: "birthYear", message: "1900년부터 올해까지의 연도여야 해요." });
        } else next.birthYear = value as number | null;
      }
      if ("occupation" in body) {
        if (body.occupation !== null && !OCCUPATIONS.includes(body.occupation as string)) {
          errors.push({
            field: "occupation",
            message: "STUDENT / EMPLOYEE / OTHER 중 하나여야 해요.",
          });
        } else next.occupation = body.occupation as FinancialProfile["occupation"];
      }
      if ("housingType" in body) {
        if (body.housingType !== null && !HOUSING.includes(body.housingType as string)) {
          errors.push({
            field: "housingType",
            message: "FAMILY / RENT / OWN / OTHER 중 하나여야 해요.",
          });
        } else next.housingType = body.housingType as FinancialProfile["housingType"];
      }
      if ("regionCode" in body) next.regionCode = (body.regionCode as string | null) ?? null;
      for (const field of MONEY_FIELDS) {
        if (!(field in body)) continue;
        const value = body[field];
        if (
          value !== null &&
          (!Number.isInteger(value) || (value as number) < 0 || (value as number) > 10 ** 12)
        ) {
          errors.push({ field, message: "0원 이상 1조 원 이하의 정수여야 해요." });
        } else next[field] = value as number | null;
      }
      if (errors.length > 0) return validationError(errors);

      next.updatedAt = MOCK_NOW;
      Object.assign(financialProfile(), next);
      return ok(financialProfile());
    },
  },

  // GOAL-01 · 미설정이면 data: null
  { method: "GET", path: "/me/goal", handler: () => ok(getMockGoal()) },

  // GOAL-02
  {
    method: "PUT",
    path: "/me/goal",
    handler: (request) => {
      const body = bodyAsObject(request);
      const errors: Array<{ field: string; message: string }> = [];
      const title = typeof body?.title === "string" ? body.title.trim() : "";
      const targetAmount = body?.targetAmount;
      const targetDate = body?.targetDate;

      if (title.length < 1 || title.length > 50)
        errors.push({ field: "title", message: "1~50자로 입력해 주세요." });
      if (
        !Number.isInteger(targetAmount) ||
        (targetAmount as number) < 1 ||
        (targetAmount as number) > 10 ** 12
      ) {
        errors.push({ field: "targetAmount", message: "1원 이상 1조 원 이하의 정수여야 해요." });
      }
      if (typeof targetDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        errors.push({ field: "targetDate", message: "YYYY-MM-DD 형식이어야 해요." });
      } else if (targetDate <= MOCK_TODAY) {
        errors.push({ field: "targetDate", message: "오늘 이후 날짜여야 해요." });
      } else if (targetDate > mockDateAfter(3652)) {
        errors.push({ field: "targetDate", message: "오늘부터 최대 10년 안이어야 해요." });
      }
      if (errors.length > 0) return validationError(errors);

      const current = getMockGoal();
      const currentAmount = current?.currentAmount ?? 0;
      const goal: Goal = {
        id: current?.id ?? "goal_demo_01",
        title,
        targetAmount: targetAmount as number,
        targetDate: targetDate as string,
        currentAmount,
        progressPercent: Math.min(
          100,
          Math.round((currentAmount / (targetAmount as number)) * 1000) / 10,
        ),
      };
      setMockGoal(goal);
      return ok(goal);
    },
  },

  // USAGE-01 · 토큰 정책은 미정. 화면의 "남은 이용 횟수"를 만들 수 있도록 단가를 예시로 정했습니다.
  // (레포트 3토큰 → 2회, 시뮬레이션 2토큰 → 3회, 챗봇 1토큰)
  {
    method: "GET",
    path: "/me/usage",
    handler: () => {
      const usage = usageState();
      return ok({
        plan: "FREE",
        tokenBalance: tokenBalance(),
        tokensGranted: usage.tokensGranted,
        tokensUsed: usage.tokensUsed,
        resetsAt: null,
        costs: (Object.keys(TOKEN_COSTS) as Array<keyof typeof TOKEN_COSTS>).map((feature) => ({
          feature,
          tokens: TOKEN_COSTS[feature],
        })),
      });
    },
  },

  // MARKET-01
  {
    method: "GET",
    path: "/instruments",
    handler: (request) => {
      const { query, type, sort = "TRADING_VALUE" } = request.query;
      if (query !== undefined && (query.length < 1 || query.length > 50)) {
        return validationError([{ field: "query", message: "1~50자로 입력해 주세요." }]);
      }
      let items = INSTRUMENTS.slice();
      if (type === "STOCK" || type === "ETF") items = items.filter((item) => item.type === type);
      if (query) {
        const keyword = query.toLowerCase();
        items = items.filter(
          (item) => item.name.toLowerCase().includes(keyword) || item.symbol.includes(keyword),
        );
      }
      if (sort === "GAINERS") {
        items = items
          .filter((i) => (i.changePercent ?? 0) > 0)
          .sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0));
      } else if (sort === "LOSERS") {
        items = items
          .filter((i) => (i.changePercent ?? 0) < 0)
          .sort((a, b) => (a.changePercent ?? 0) - (b.changePercent ?? 0));
      } else if (sort === "VOLUME") {
        items.sort((a, b) => b.volume - a.volume);
      } else {
        items.sort((a, b) => b.tradingValue - a.tradingValue);
      }
      return listOf(items.map(toListItem), request, true);
    },
  },

  // MARKET-02
  {
    method: "GET",
    path: "/instruments/:instrumentId",
    handler: (request) => {
      const instrument = findInstrument(request.params.instrumentId);
      return instrument ? ok(instrument, true) : notFound("종목을 찾을 수 없어요.");
    },
  },

  // MARKET-03
  {
    method: "GET",
    path: "/instruments/:instrumentId/prices",
    handler: (request) => {
      const instrument = findInstrument(request.params.instrumentId);
      if (!instrument) return notFound("종목을 찾을 수 없어요.");
      const { from, to, interval = "DAY" } = request.query;
      if (!from || !to) {
        return validationError([
          ...(!from ? [{ field: "from", message: "시작일이 필요해요." }] : []),
          ...(!to ? [{ field: "to", message: "종료일이 필요해요." }] : []),
        ]);
      }
      if (from > to) return validationError([{ field: "to", message: "시작일 이후여야 해요." }]);
      if (interval !== "DAY" && interval !== "WEEK" && interval !== "MONTH") {
        return validationError([
          { field: "interval", message: "DAY / WEEK / MONTH 중 하나여야 해요." },
        ]);
      }
      return ok(
        {
          instrumentId: instrument.id,
          interval,
          points: generatePrices(instrument.id, instrument.price, from, to, interval),
        },
        true,
      );
    },
  },

  // PROFILE-03 · 미진단이면 data: null
  { method: "GET", path: "/investment-profiles/latest", handler: () => ok(profileState().latest) },

  // ASSET-04 · 자산 추이 (날짜 오름차순). 마지막 날은 요약의 총자산과 같습니다.
  {
    method: "GET",
    path: "/assets/history",
    handler: (request) => {
      const { from, to } = request.query;
      const errors: Array<{ field: string; message: string }> = [];
      if (!from) errors.push({ field: "from", message: "시작일이 필요해요." });
      if (!to) errors.push({ field: "to", message: "종료일이 필요해요." });
      if (errors.length > 0) return validationError(errors);
      if (from > to) return validationError([{ field: "to", message: "시작일 이후여야 해요." }]);

      const days = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
      if (days > 366)
        return validationError([{ field: "to", message: "기간은 최대 366일이에요." }]);
      if (to > MOCK_TODAY)
        return validationError([{ field: "to", message: "오늘 이하여야 해요." }]);

      const end = getAssetSummary().totalAssets;
      const items = [];
      for (let i = 0; i <= days; i += 1) {
        const date = new Date(Date.parse(from) + i * 86_400_000).toISOString().slice(0, 10);
        const daysFromToday = Math.round((Date.parse(MOCK_TODAY) - Date.parse(date)) / 86_400_000);
        const total =
          Math.round(
            (end * (1 - daysFromToday * 0.0007 + Math.sin(daysFromToday / 2.3) * 0.004)) / 1000,
          ) * 1000;
        const totalAssets = daysFromToday === 0 ? end : total;
        items.push({ date, totalAssets, totalDebt: 0, netAssets: totalAssets });
      }
      return ok({ items, nextCursor: null }, true);
    },
  },

  // PAPER-01
  { method: "GET", path: "/paper/portfolio", handler: () => ok(buildPortfolio(), true) },
];
