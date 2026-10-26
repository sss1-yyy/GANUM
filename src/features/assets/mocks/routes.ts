import { created, ok } from "@/mocks/helpers";
import { assetState, getAssetSummary } from "@/mocks/shared/assets";
import type { MockRoute } from "@/mocks/types";
import type { Holding } from "@/shared/types";
import type { Account, CryptoItem, SavingsItem } from "../types";

/**
 * 내 자산 목데이터. 값은 Figma 내 자산 화면(연결 후)을 그대로 옮겼어요.
 * 합계: 예적금 11,000,000 + 증권 5,300,000 + 입출금 3,500,000 + 코인 1,200,000 = 21,000,000
 * ⚠ 코인 상세 화면의 합계는 1,060,000원으로 요약(1,200,000원)과 달라요. Figma 그대로 두었습니다.
 */
const ACCOUNTS: Account[] = [
  {
    id: "acc_kakao",
    institution: "카카오뱅크",
    name: "입출금통장",
    balance: 1_500_000,
    type: "CASH",
  },
  {
    id: "acc_toss",
    institution: "토스뱅크",
    name: "토스뱅크 통장",
    balance: 1_200_000,
    type: "CASH",
  },
  {
    id: "acc_hana",
    institution: "하나은행",
    name: "급여하나 통장",
    balance: 800_000,
    type: "CASH",
  },
  {
    id: "acc_stock",
    institution: "증권",
    name: "종합매매 계좌",
    balance: 5_300_000,
    type: "STOCK",
  },
];

const SAVINGS: SavingsItem[] = [
  {
    id: "sav_leap",
    name: "청년도약계좌",
    balance: 4_200_000,
    interestRate: 4.5,
    termMonths: 60,
    monthlyDeposit: 700_000,
  },
  {
    id: "sav_deposit",
    name: "정기예금",
    balance: 3_000_000,
    interestRate: 3.2,
    termMonths: 12,
    monthlyDeposit: null,
  },
  {
    id: "sav_free",
    name: "자유적금",
    balance: 2_300_000,
    interestRate: 3.8,
    termMonths: 6,
    monthlyDeposit: null,
  },
  {
    id: "sav_emergency",
    name: "비상금 통장",
    balance: 1_500_000,
    interestRate: 2.0,
    termMonths: null,
    monthlyDeposit: null,
  },
];

function holding(id: string, name: string, qty: number, price: number, pct: number): Holding {
  const marketValue = qty * price;
  const cost = Math.round(marketValue / (1 + pct / 100));
  return {
    instrumentId: id,
    name,
    quantity: String(qty),
    averagePrice: String(Math.round(cost / qty)),
    currentPrice: price,
    marketValue,
    profitLoss: marketValue - cost,
    profitLossPercent: pct,
    weightPercent: Math.round((marketValue / 5_300_000) * 1000) / 10,
  };
}

// Figma 증권 화면: 삼성전자 11주 +1.5% / SK하이닉스 1주 +0.4% / 한미반도체 1주 +1.3% / KODEX 200 5주 +0.6%
const HOLDINGS: Holding[] = [
  holding("ins_005930", "삼성전자", 11, 276_000, 1.5),
  holding("ins_000660", "SK하이닉스", 1, 1_841_000, 0.4),
  holding("ins_042700", "한미반도체", 1, 272_000, 1.3),
  holding("ins_069500", "KODEX 200", 5, 30_200, 0.6),
];

const CRYPTO: CryptoItem[] = [
  {
    id: "btc",
    name: "비트코인",
    symbol: "BTC",
    quantity: "0.008",
    amount: 540_000,
    changePercent: -3.2,
  },
  {
    id: "eth",
    name: "이더리움",
    symbol: "ETH",
    quantity: "0.12",
    amount: 300_000,
    changePercent: -5.1,
  },
  { id: "xrp", name: "리플", symbol: "XRP", quantity: "100", amount: 140_000, changePercent: -1.8 },
  {
    id: "sol",
    name: "솔라나",
    symbol: "SOL",
    quantity: "0.5",
    amount: 80_000,
    changePercent: -4.6,
  },
];

const connected = () => assetState().connected;
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export const assetsMockRoutes: MockRoute[] = [
  // ASSET-01
  { method: "GET", path: "/assets/summary", handler: () => ok(getAssetSummary(), true) },

  // ASSET-03
  {
    method: "GET",
    path: "/assets/holdings",
    handler: () => ok({ items: connected() ? HOLDINGS : [], nextCursor: null }, true),
  },

  // [명세 외] 계좌 목록
  {
    method: "GET",
    path: "/assets/accounts",
    handler: () => ok({ items: connected() ? ACCOUNTS : [] }, true),
  },

  // [명세 외] 예적금
  {
    method: "GET",
    path: "/assets/savings",
    handler: () =>
      ok(
        {
          totalAmount: connected() ? sum(SAVINGS.map((s) => s.balance)) : 0,
          monthlyChangeAmount: connected() ? 200_000 : null,
          items: connected() ? SAVINGS : [],
        },
        true,
      ),
  },

  // [명세 외] 코인
  {
    method: "GET",
    path: "/assets/crypto",
    handler: () =>
      ok(
        {
          totalAmount: connected() ? sum(CRYPTO.map((c) => c.amount)) : 0,
          monthlyChangeAmount: connected() ? -140_000 : null,
          items: connected() ? CRYPTO : [],
        },
        true,
      ),
  },

  // [명세 외] 금융기관 연결하기 (연동 제공처·절차는 미정이라 목에서는 즉시 연결됨으로 바꿉니다)
  {
    method: "POST",
    path: "/assets/connections",
    handler: () => {
      assetState().connected = true;
      return created(getAssetSummary(), true);
    },
  },
];
