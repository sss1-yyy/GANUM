import { diagnosisMockRoutes } from "@/features/diagnosis/mocks/routes";
import { reportMockRoutes } from "@/features/report/mocks/routes";
import { simulationMockRoutes } from "@/features/simulation/mocks/routes";
import { assetsMockRoutes } from "@/features/assets/mocks/routes";
import { benefitsMockRoutes } from "@/features/benefits/mocks/routes";
import { mypageMockRoutes } from "@/features/mypage/mocks/routes";
import { chatMockRoutes } from "@/features/chat/mocks/routes";
import { investMockRoutes } from "@/features/invest/mocks/routes";
import { homeMockRoutes } from "@/features/home/mocks/routes";
import { sharedRoutes } from "./shared/routes";
import type { MockRoute } from "./types";

/**
 * 목 서버가 처리하는 모든 API. 새 기능을 추가하면 자기 mocks/routes.ts 의 배열을 여기에 한 줄 추가하세요.
 * 같은 Method+Path 가 둘 이상이면 앞에 있는 것이 이깁니다.
 */
export const mockRoutes: MockRoute[] = [
  ...sharedRoutes,
  ...homeMockRoutes,
  ...diagnosisMockRoutes,
  ...investMockRoutes,
  ...chatMockRoutes,
  ...reportMockRoutes,
  ...simulationMockRoutes,
  ...assetsMockRoutes,
  ...benefitsMockRoutes,
  ...mypageMockRoutes,
];
