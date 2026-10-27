import type { InstrumentDetail } from "@/shared/types";

/**
 * 모든 기능이 함께 쓰는 종목 목데이터입니다. (MARKET-01/02)
 * 값의 출처: Figma 의 종목 이름·가격·등락률. Figma 에 없는 값(시가총액 등)은 예시입니다.
 * 거래량·거래대금은 Figma 의 순위(거래대금/거래량 탭)가 그대로 나오도록 정한 예시 값입니다.
 */
function stock(
  symbol: string,
  name: string,
  price: number,
  changeAmount: number,
  changePercent: number,
  volume: number,
  tradingValue: number,
  extra: Partial<InstrumentDetail> = {},
): InstrumentDetail {
  return {
    id: `ins_${symbol}`,
    symbol,
    name,
    type: "STOCK",
    market: "KRX",
    price,
    changeAmount,
    changePercent,
    volume,
    tradingValue: Math.round(tradingValue),
    marketCap: null,
    high52Week: null,
    low52Week: null,
    ...extra,
  };
}

const 조 = 1_000_000_000_000;

export const INSTRUMENTS: InstrumentDetail[] = [
  stock("005930", "삼성전자", 276_000, 0, 0, 1_240_000, 2.4 * 조, {
    marketCap: 400 * 조,
    high52Week: 310_000,
    low52Week: 180_000,
  }),
  stock("042700", "한미반도체", 1_577_000, 20_100, 1.3, 860_000, 1.9 * 조, {
    marketCap: 15 * 조,
    high52Week: 1_700_000,
    low52Week: 900_000,
  }),
  stock("402340", "SK스퀘어", 1_157_000, 1_200, 0.1, 710_000, 1.5 * 조, {
    marketCap: 15 * 조,
    high52Week: 1_300_000,
    low52Week: 700_000,
  }),
  stock("000660", "SK하이닉스", 1_841_000, 7_400, 0.4, 580_000, 1.2 * 조, {
    marketCap: 134 * 조,
    high52Week: 2_010_000,
    low52Week: 1_120_000,
  }),
  stock("009150", "삼성전기", 1_577_000, 15_600, 1.0, 440_000, 0.9 * 조, {
    marketCap: 12 * 조,
    high52Week: 1_800_000,
    low52Week: 1_000_000,
  }),
  stock("035420", "NAVER", 191_500, -1_200, -0.6, 310_000, 0.6 * 조, { marketCap: 31 * 조 }),
  stock("005380", "현대차", 241_000, 1_900, 0.8, 280_000, 0.55 * 조, { marketCap: 50 * 조 }),
  // 급상승 순위 (Figma: 급상승 탭)
  stock("086520", "에코프로", 612_000, 67_700, 12.4, 120_000, 0.2 * 조),
  stock("454910", "두산로보틱스", 98_500, 8_800, 9.8, 150_000, 0.18 * 조),
  stock("196170", "알테오젠", 421_000, 31_500, 8.1, 90_000, 0.16 * 조),
  stock("010120", "LS일렉트릭", 236_000, 14_900, 6.7, 70_000, 0.14 * 조),
  stock("003670", "포스코퓨처엠", 193_100, 9_700, 5.3, 80_000, 0.13 * 조),
  // 급하락 순위 (Figma: 급하락 탭)
  stock("035720", "카카오", 41_200, -3_250, -7.3, 400_000, 0.17 * 조),
  stock("036570", "NC소프트", 198_000, -12_400, -5.9, 60_000, 0.12 * 조),
  stock("259960", "크래프톤", 312_000, -14_400, -4.4, 50_000, 0.11 * 조),
  stock("028300", "HLB", 62_300, -2_460, -3.8, 130_000, 0.1 * 조),
  stock("068270", "셀트리온", 172_500, -5_150, -2.9, 100_000, 0.09 * 조),
  {
    id: "ins_069500",
    symbol: "069500",
    name: "KODEX 200",
    type: "ETF",
    market: "KRX",
    price: 284_000,
    changeAmount: -1_700,
    changePercent: -0.6,
    volume: 900_000,
    tradingValue: Math.round(0.7 * 조),
    marketCap: null,
    high52Week: null,
    low52Week: null,
  },
  {
    id: "ins_360750",
    symbol: "360750",
    name: "TIGER 미국S&P500",
    type: "ETF",
    market: "KRX",
    price: 21_500,
    changeAmount: 60,
    changePercent: 0.3,
    volume: 700_000,
    tradingValue: Math.round(0.3 * 조),
    marketCap: null,
    high52Week: null,
    low52Week: null,
  },
];

export function findInstrument(id: string): InstrumentDetail | undefined {
  return INSTRUMENTS.find((item) => item.id === id);
}

export function toListItem(detail: InstrumentDetail) {
  const { marketCap, high52Week, low52Week, ...rest } = detail;
  void marketCap;
  void high52Week;
  void low52Week;
  return rest;
}
