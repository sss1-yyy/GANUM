import type { Holding } from "@/shared/types";

/**
 * ⚠ [명세 외] 아래 타입은 Figma 내 자산 화면(계좌 목록·예적금·코인)에 필요하지만
 * API 명세서 v0.2 에 없는 응답입니다. 백엔드와 협의 후 바꿔야 해요. (docs/figma-api-gaps.md)
 */
export interface Account {
  id: string;
  institution: string;
  name: string;
  balance: number;
  /** 입출금 계좌(CASH) 또는 증권 계좌(STOCK) */
  type: "CASH" | "STOCK";
}

export interface AccountsData {
  items: Account[];
}

export interface SavingsItem {
  id: string;
  name: string;
  balance: number;
  /** 연 이율(%) */
  interestRate: number;
  termMonths: number | null;
  monthlyDeposit: number | null;
}

export interface CryptoItem {
  id: string;
  name: string;
  symbol: string;
  /** 소수 정밀도 때문에 문자열 */
  quantity: string;
  amount: number;
  changePercent: number;
}

/** 카테고리 상세 공통 모양: 합계 + 지난달 대비 + 항목들 */
export interface CategoryDetail<T> {
  totalAmount: number;
  monthlyChangeAmount: number | null;
  items: T[];
}

export type HoldingsDetail = CategoryDetail<Holding>;
