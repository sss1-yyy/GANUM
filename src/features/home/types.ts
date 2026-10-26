import type {
  AssetSummary,
  Benefit,
  ChatContextType,
  Goal,
  InvestmentProfile,
  User,
} from "@/shared/types";

/** HOME-01 · 홈 대시보드 */
export interface CoachCard {
  id: string;
  title: string;
  question: string;
  contextType: ChatContextType;
}

export interface HomeDashboard {
  user: User;
  assetSummary: AssetSummary;
  investmentProfile: InvestmentProfile | null;
  goal: Goal | null;
  coachCard: CoachCard;
  /** 홈에는 최대 3개 */
  benefits: Benefit[];
  unreadNotificationCount: number;
}
