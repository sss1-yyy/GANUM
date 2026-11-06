"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import {
  getInstrument,
  getLatestInvestmentProfile,
  getPaperPortfolio,
} from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { cn } from "@/shared/lib/cn";
import {
  changeTone,
  formatKRW,
  formatNumber,
  formatSignedKRW,
  formatSignedPercent,
  type ChangeTone,
} from "@/shared/lib/format";
import { formatAsOf, referenceDate, shiftDate } from "@/shared/lib/format-time";
import { getPrices, investKeys } from "../api";
import { TONE_CLASSES, toneClass } from "../lib/tone";
import type { PricePoint } from "../types";

/**
 * 차트 기간 탭. "1일(분 단위)" 차트는 API 에 없어서 최근 5일(일 간격)로 대체해요.
 * (docs/figma-api-gaps.md)
 */
const PERIOD_TABS = [
  { key: "D1", label: "1일", days: 5, interval: "DAY" },
  { key: "W1", label: "1주", days: 7, interval: "DAY" },
  { key: "M1", label: "1달", days: 30, interval: "DAY" },
  { key: "Y1", label: "1년", days: 365, interval: "WEEK" },
] as const;

type PeriodKey = (typeof PERIOD_TABS)[number]["key"];

/** 시가총액·거래대금처럼 큰 금액을 "134.5조 원 / 1,250억 원" 으로 줄여요 */
function formatCompactKRW(value: number | null): string {
  if (value === null) return "-";
  if (value >= 1_0000_0000_0000) {
    const jo = value / 1_0000_0000_0000;
    const text = jo >= 100 ? formatNumber(Math.round(jo)) : (Math.round(jo * 10) / 10).toString();
    return `${text}조 원`;
  }
  if (value >= 1_0000_0000) return `${formatNumber(Math.round(value / 1_0000_0000))}억 원`;
  return formatKRW(value);
}

/** 종목 상세 (MARKET-02 + MARKET-03 + PAPER-01 보유 + PROFILE-03 성향) */
export function InstrumentDetailScreen({ instrumentId }: { instrumentId: string }) {
  const [period, setPeriod] = useState<PeriodKey>("W1");
  /** 하트는 명세에 저장 API 가 없어서 화면 안 임시 상태예요 (docs/figma-api-gaps.md) */
  const [liked, setLiked] = useState(false);

  const detail = useQuery({
    queryKey: sharedKeys.instrument(instrumentId),
    queryFn: () => getInstrument(instrumentId),
  });
  const portfolio = useQuery({
    queryKey: sharedKeys.paperPortfolio,
    queryFn: () => getPaperPortfolio(),
  });
  const profile = useQuery({
    queryKey: sharedKeys.latestProfile,
    queryFn: () => getLatestInvestmentProfile(),
  });

  const periodTab = PERIOD_TABS.find((item) => item.key === period) ?? PERIOD_TABS[1];
  // 목 모드의 "오늘"(2026-10-25)과 어긋나지 않게 서버 기준 시각으로 기간을 계산해요
  const to = referenceDate(detail.data?.meta?.asOf);
  const from = shiftDate(to, -periodTab.days);
  const prices = useQuery({
    enabled: detail.isSuccess,
    queryKey: investKeys.prices(instrumentId, from, to, periodTab.interval),
    queryFn: ({ signal }) =>
      getPrices(instrumentId, { from, to, interval: periodTab.interval }, signal),
  });

  // 보유 여부(매도 가능)까지 확인해야 해서 종목·포트폴리오를 함께 기다려요
  if (detail.isPending || portfolio.isPending) {
    return (
      <ScreenFrame>
        <p className="text-caption text-text-sub py-20 text-center">불러오는 중…</p>
      </ScreenFrame>
    );
  }
  // 포트폴리오 조회 실패를 "보유 없음"으로 착각해 매도를 막지 않도록 함께 안내해요
  if (detail.isError || portfolio.isError) {
    return (
      <ScreenFrame className="items-center gap-3 py-20">
        <p role="alert" className="text-caption text-danger">
          종목 정보를 불러오지 못했어요.
        </p>
        <button
          type="button"
          onClick={() => {
            if (detail.isError) void detail.refetch();
            if (portfolio.isError) void portfolio.refetch();
          }}
          className="rounded-button bg-sub px-5 py-2"
        >
          <span className="text-caption text-primary font-semibold">다시 시도하기</span>
        </button>
      </ScreenFrame>
    );
  }

  const item = detail.data.data;
  const holding =
    portfolio.data.data.holdings.find((entry) => entry.instrumentId === instrumentId) ?? null;
  const typeLabel = profile.data?.data?.typeLabel ?? null;
  // 52주 최고/최저 차이가 30% 이상이면 "변동이 큰 종목"으로 안내해요 (둘 중 하나라도 없으면 일반 안내)
  const isVolatile =
    item.high52Week !== null && item.low52Week !== null && item.low52Week > 0
      ? (item.high52Week - item.low52Week) / item.low52Week >= 0.3
      : null;
  const pricePoints = prices.data?.data.points ?? [];
  const periodTone: ChangeTone =
    pricePoints.length >= 2
      ? changeTone(pricePoints[pricePoints.length - 1].close - pricePoints[0].close)
      : "flat";

  return (
    <ScreenFrame className="gap-4">
      {/* 종목 이름·현재가. 업종명은 API 에 없어서 종목 코드만 보여줘요 (docs/figma-api-gaps.md) */}
      <header>
        <p className="text-caption text-text-muted">{item.symbol}</p>
        <div className="flex items-center justify-between">
          <h1 className="text-title text-text-strong font-bold">{item.name}</h1>
          <button
            type="button"
            aria-label={liked ? "관심 종목 해제" : "관심 종목 등록"}
            aria-pressed={liked}
            onClick={() => setLiked((prev) => !prev)}
            className="p-1"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className={cn("size-6", liked ? "text-like" : "text-outline")}
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" />
            </svg>
          </button>
        </div>
        <p className="text-text-strong mt-1 text-[26px] leading-tight font-bold">
          {formatKRW(item.price)}
        </p>
        <p className="text-caption mt-1">
          <span className={cn("font-semibold", toneClass(item.changePercent))}>
            {formatSignedKRW(item.changeAmount)}({formatSignedPercent(item.changePercent)})
          </span>{" "}
          <span className="text-text-sub">오늘</span>
        </p>
      </header>

      {/* 기간 탭 */}
      <div
        role="tablist"
        aria-label="차트 기간"
        className="border-line flex gap-1 rounded-[12px] border p-1"
      >
        {PERIOD_TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            role="tab"
            aria-selected={period === tabItem.key}
            onClick={() => setPeriod(tabItem.key)}
            className={cn(
              "text-caption flex-1 rounded-[8px] py-1.5 font-semibold",
              period === tabItem.key ? "bg-primary text-surface" : "text-text-muted",
            )}
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* 가격 차트 (MARKET-03) */}
      {prices.isPending && (
        <p className="text-caption text-text-sub py-14 text-center">차트를 불러오는 중…</p>
      )}
      {prices.isError && (
        <div className="flex flex-col items-center gap-3 py-10">
          <p role="alert" className="text-caption text-danger">
            차트를 불러오지 못했어요.
          </p>
          <button
            type="button"
            onClick={() => void prices.refetch()}
            className="rounded-button bg-sub px-5 py-2"
          >
            <span className="text-caption text-primary font-semibold">다시 시도하기</span>
          </button>
        </div>
      )}
      {prices.isSuccess && (
        <section>
          <PriceChart points={pricePoints} tone={periodTone} />
          {/* 실시간 여부를 추정하지 않고 기준 시각을 보여줘요 (API 명세 공통 규칙) */}
          <p className="text-caption text-text-muted mt-1 text-right">
            {formatAsOf(prices.data.meta?.asOf)}
          </p>
        </section>
      )}

      {/* AI 코치 안내 — 문구는 Figma 의 예시 문구예요 (docs/figma-api-gaps.md) */}
      <section className="rounded-card shadow-ai from-coach to-primary-light bg-gradient-to-br p-4">
        <span className="bg-surface/20 text-surface text-caption inline-block rounded-full px-3 py-1 font-semibold">
          내 성향{typeLabel ? `(${typeLabel})` : ""} 기준
        </span>
        {/* 52주 고저 폭으로 나누는 간단 안내 — 서버 분석이 아니라 화면 계산 예시예요 */}
        <p className="text-surface mt-2.5 leading-[1.5] font-semibold">
          {isVolatile === null
            ? "투자 전에 가격 변동 폭을 함께 살펴보세요."
            : isVolatile
              ? "변동이 큰 종목이에요."
              : "변동이 비교적 완만한 종목이에요."}
          <br />
          전체 자산의 10% 이하로 시작해 보세요.
        </p>
        {/* TODO(챗봇): AI 금융 코치 시트를 만들면 여기서 열어요 (contextType: INSTRUMENT) */}
        <button
          type="button"
          className="bg-surface text-primary mt-3 w-full rounded-full py-2.5 text-[15px] font-semibold"
        >
          쉽게 설명 듣기
        </button>
      </section>

      {/* 내 보유 (PAPER-01) — 보유 중일 때만 */}
      {holding && (
        <section className="rounded-card bg-bg p-4">
          <h2 className="text-text-strong font-semibold">내 보유</h2>
          <dl className="mt-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <dt className="text-text-sub text-[15px]">보유 수량</dt>
              <dd className="text-text-strong font-semibold">
                {formatNumber(Number(holding.quantity))}주
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-sub text-[15px]">평균 매수가</dt>
              <dd className="text-text-strong font-semibold">
                {holding.averagePrice ? formatKRW(Number(holding.averagePrice)) : "-"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-sub text-[15px]">평가 손익</dt>
              <dd className={cn("font-semibold", toneClass(holding.profitLoss))}>
                {holding.profitLoss !== null
                  ? `${formatSignedKRW(holding.profitLoss)}(${formatSignedPercent(holding.profitLossPercent)})`
                  : "-"}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {/* 종목 정보 (MARKET-02) */}
      <section aria-label="종목 정보">
        <InfoRow label="시가총액" value={formatCompactKRW(item.marketCap)} />
        <InfoRow label="거래대금" value={formatCompactKRW(item.tradingValue)} />
        <InfoRow label="52주 최고" value={item.high52Week ? formatKRW(item.high52Week) : "-"} />
        <InfoRow label="52주 최저" value={item.low52Week ? formatKRW(item.low52Week) : "-"} />
      </section>

      {/* 매수·매도 버튼. 보유가 없으면 매도는 비활성이에요 */}
      <div className="bg-surface sticky bottom-0 -mx-8 mt-auto flex gap-3 px-8 pt-3 pb-1">
        {holding ? (
          <Link
            href={`/invest/${instrumentId}/order?side=SELL`}
            className="rounded-button bg-chip-gray text-text flex-1 py-3.5 text-center font-semibold"
          >
            매도하기
          </Link>
        ) : (
          <span
            aria-disabled
            className="rounded-button bg-chip-gray text-text-muted flex-1 py-3.5 text-center font-semibold"
          >
            매도하기
          </span>
        )}
        <Link
          href={`/invest/${instrumentId}/order?side=BUY`}
          className="rounded-button bg-primary text-surface flex-1 py-3.5 text-center font-semibold"
        >
          매수하기
        </Link>
      </div>
    </ScreenFrame>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line flex items-center justify-between border-b py-3 last:border-b-0">
      <span className="text-text-sub text-[15px]">{label}</span>
      <span className="text-text-strong font-semibold">{value}</span>
    </div>
  );
}

/** 종가 라인 차트. 기간 수익이 플러스면 빨강, 마이너스면 파랑으로 그려요 */
function PriceChart({ points, tone }: { points: PricePoint[]; tone: ChangeTone }) {
  const width = 329;
  const height = 150;
  const padding = 6;

  if (points.length < 2) {
    return (
      <p className="text-caption text-text-muted py-14 text-center">
        기간 안에 가격 데이터가 없어요.
      </p>
    );
  }

  const closes = points.map((point) => point.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || max * 0.01 || 1;
  const stepX = (width - padding * 2) / (points.length - 1);
  const coords = points.map((point, index) => ({
    x: padding + stepX * index,
    y: padding + (height - padding * 2) * (1 - (point.close - min) / range),
  }));
  const line = coords.map((coord) => `${coord.x},${coord.y}`).join(" ");
  const area = `M ${coords.map((coord) => `${coord.x},${coord.y}`).join(" L ")} L ${
    coords[coords.length - 1].x
  },${height} L ${coords[0].x},${height} Z`;
  // x축 날짜 라벨은 5개만 고르게 보여줘요
  const labelCount = Math.min(5, points.length);
  const labels = Array.from({ length: labelCount }, (_, index) => {
    const point = points[Math.round((index * (points.length - 1)) / (labelCount - 1))];
    const [, month, day] = point.date.split("-");
    return `${Number(month)}/${Number(day)}`;
  });

  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className={cn("h-[150px] w-full", TONE_CLASSES[tone])}
        role="img"
        aria-label="기간별 종가 차트"
      >
        <path d={area} fill="currentColor" opacity={0.08} />
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <figcaption className="text-caption text-text-muted mt-1 flex justify-between">
        {labels.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </figcaption>
    </figure>
  );
}
