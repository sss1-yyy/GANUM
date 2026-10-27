import { apiGet, apiPost } from "@/shared/api";
import type { ListData } from "@/shared/api";
import type { AssetSummary, Holding } from "@/shared/types";
import type { AccountsData, CategoryDetail, CryptoItem, SavingsItem } from "./types";

// ASSET-01 · 실제 자산 요약
export const getAssetSummary = () => apiGet<AssetSummary>("/assets/summary");

// ASSET-03 · 실제 투자 보유 목록
export const getAssetHoldings = () => apiGet<ListData<Holding>>("/assets/holdings");

// [명세 외] 계좌 목록 / 예적금 / 코인 / 금융기관 연결
export const getAccounts = () => apiGet<AccountsData>("/assets/accounts");
export const getSavings = () => apiGet<CategoryDetail<SavingsItem>>("/assets/savings");
export const getCrypto = () => apiGet<CategoryDetail<CryptoItem>>("/assets/crypto");
export const connectAssets = () => apiPost<AssetSummary>("/assets/connections");

export const assetKeys = {
  summary: ["assets", "summary"] as const,
  holdings: ["assets", "holdings"] as const,
  accounts: ["assets", "accounts"] as const,
  savings: ["assets", "savings"] as const,
  crypto: ["assets", "crypto"] as const,
};
