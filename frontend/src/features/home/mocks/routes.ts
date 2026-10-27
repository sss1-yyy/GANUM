import { unreadCount } from "@/mocks/shared/notifications";
import { getAssetSummary } from "@/mocks/shared/assets";
import { ok } from "@/mocks/helpers";
import { MOCK_BENEFITS, MOCK_USER, getMockGoal, profileState } from "@/mocks/shared/user";
import type { MockRoute } from "@/mocks/types";
import type { HomeDashboard } from "../types";

/** HOME-01 — 다른 기능의 목데이터(자산·성향·목표·혜택)를 모아서 내려줍니다. */
export const homeMockRoutes: MockRoute[] = [
  {
    method: "GET",
    path: "/home",
    handler: () => {
      const dashboard: HomeDashboard = {
        user: MOCK_USER,
        assetSummary: getAssetSummary(),
        investmentProfile: profileState().latest,
        goal: getMockGoal(),
        coachCard: {
          id: "coach_rate_cut",
          title: "기준금리 인하",
          question: "기준금리가 내렸어요. 내 적금에는 어떤 영향이 있을까요?",
          contextType: "HOME",
        },
        benefits: MOCK_BENEFITS.slice(0, 3),
        unreadNotificationCount: unreadCount(),
      };
      return ok(dashboard, true);
    },
  },
];
