import { mockState } from "../store";
import { MOCK_ASSET_SUMMARY } from "./user";
import type { AssetSummary } from "@/shared/types";

/**
 * 실제 자산 연결 상태. 기본은 "연결됨" 이에요.
 * "연결 전" 화면을 보고 싶으면 .env.local 에 NEXT_PUBLIC_MOCK_ASSETS=disconnected 를 넣고 다시 실행하세요.
 * (연결하기 버튼을 누르면 연결됨으로 바뀌어요)
 */
export const assetState = () =>
  mockState<{ connected: boolean }>("assets", () => ({
    connected: process.env.NEXT_PUBLIC_MOCK_ASSETS !== "disconnected",
  }));

export function getAssetSummary(): AssetSummary {
  if (assetState().connected) return MOCK_ASSET_SUMMARY;
  return {
    totalAssets: 0,
    totalDebt: 0,
    netAssets: 0,
    monthlyChangeAmount: null,
    monthlyChangePercent: null,
    categories: [],
    connectionStatus: "NOT_CONNECTED",
  };
}
