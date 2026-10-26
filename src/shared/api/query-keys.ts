/**
 * TanStack Query 의 queryKey 규칙: [기능이름, ...세부]
 * 여러 기능이 함께 쓰는 키만 여기에 두고, 한 기능에서만 쓰는 키는 기능 폴더에 둡니다.
 */
export const sharedKeys = {
  me: ["me"] as const,
  goal: ["goal"] as const,
  financialProfile: ["me", "financial-profile"] as const,
  usage: ["me", "usage"] as const,
  instruments: (params?: object) => ["instruments", params ?? {}] as const,
  instrument: (id: string) => ["instruments", "detail", id] as const,
  paperPortfolio: ["paper", "portfolio"] as const,
  latestProfile: ["investment-profile", "latest"] as const,
  assetHistory: (from: string, to: string) => ["assets", "history", from, to] as const,
};
