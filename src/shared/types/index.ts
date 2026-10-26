/**
 * 여러 기능이 함께 쓰는 API 데이터 모양입니다. (API 명세서 v0.2 기준)
 * 한 기능에서만 쓰는 타입은 그 기능 폴더(src/features/<기능>/types.ts)에 두세요.
 */

export type ChatContextType = "HOME" | "ASSET" | "BENEFIT" | "REPORT" | "INSTRUMENT" | "SIMULATION";

// USER-01
export interface User {
  id: string;
  nickname: string;
  onboardingCompleted: boolean;
}

// GOAL-01
export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  targetDate: string;
  currentAmount: number;
  progressPercent: number;
}

// ASSET-01
export type AssetCategoryType = "CASH" | "DEPOSIT" | "STOCK" | "ETF" | "CRYPTO" | "OTHER";
export type AssetConnectionStatus = "NOT_CONNECTED" | "CONNECTED" | "PARTIAL" | "ERROR";

export interface AssetCategorySummary {
  type: AssetCategoryType;
  amount: number;
  weightPercent: number;
}

export interface AssetSummary {
  totalAssets: number;
  totalDebt: number;
  netAssets: number;
  monthlyChangeAmount: number | null;
  monthlyChangePercent: number | null;
  categories: AssetCategorySummary[];
  connectionStatus: AssetConnectionStatus;
}

// ASSET-04
export interface AssetHistoryPoint {
  date: string;
  totalAssets: number;
  totalDebt: number;
  netAssets: number;
}

// PROFILE-02 / PROFILE-03
export type InvestmentType = "CAUTIOUS" | "BALANCED" | "BOLD" | "FREE";

export interface InvestmentProfile {
  id: string;
  questionnaireVersion: string;
  type: InvestmentType;
  typeLabel: string;
  description: string;
  guides: string[];
  createdAt: string;
}

// BENEFIT-01
export type BenefitCategory = "SAVING" | "HOUSING" | "EMPLOYMENT" | "EDUCATION" | "OTHER";
export type BenefitApplicationStatus = "UPCOMING" | "OPEN" | "CLOSED" | "ALWAYS" | "UNKNOWN";
export type EligibilityStatus = "LIKELY_ELIGIBLE" | "LIKELY_INELIGIBLE" | "NEEDS_INFO" | "UNKNOWN";

export interface Benefit {
  id: string;
  title: string;
  summary: string;
  category: BenefitCategory;
  applicationStatus: BenefitApplicationStatus;
  deadline: string | null;
  eligibilityStatus: EligibilityStatus;
  sourceUrl: string | null;
  updatedAt: string;
}

// MARKET-01 / MARKET-02
export type InstrumentType = "STOCK" | "ETF";

export interface Instrument {
  id: string;
  symbol: string;
  name: string;
  type: InstrumentType;
  market: "KRX";
  price: number;
  changeAmount: number;
  changePercent: number | null;
  volume: number;
  tradingValue: number;
}

export interface InstrumentDetail extends Instrument {
  marketCap: number | null;
  high52Week: number | null;
  low52Week: number | null;
}

// ASSET-03 / PAPER-01 의 보유 종목 항목
export interface Holding {
  instrumentId: string;
  name: string;
  /** 문자열: 소수 정밀도 때문 (모의투자는 정수 주식만) */
  quantity: string;
  averagePrice: string | null;
  currentPrice: number;
  marketValue: number;
  profitLoss: number | null;
  profitLossPercent: number | null;
  weightPercent: number;
}

// PAPER-01
export interface PaperAllocation {
  type: string;
  amount: number;
  weightPercent: number;
}

export interface PaperPortfolio {
  id: string;
  initialBalance: number;
  cashBalance: number;
  holdingsValue: number;
  totalValue: number;
  profitLoss: number;
  returnPercent: number;
  holdings: Holding[];
  allocation: PaperAllocation[];
}

// USER-02 / USER-03
export interface FinancialProfile {
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
