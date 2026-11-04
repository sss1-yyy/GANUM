"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { InstrumentLogo } from "@/components/domain/InstrumentLogo";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { getPaperPortfolio } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { cn } from "@/shared/lib/cn";
import {
  changeTone,
  formatArrowPercent,
  formatKRW,
  formatPercent,
  formatSignedPercent,
  type ChangeTone,
} from "@/shared/lib/format";
import { referenceDate, shiftDate } from "@/shared/lib/format-time";
import type { Holding, PaperAllocation, PaperPortfolio } from "@/shared/types";
import { getPortfolioHistory, portfolioKeys } from "../api";
import chevronRight from "../assets/chevron-right.svg";
import { CHART_HEIGHT, CHART_WIDTH, trendLine } from "../chart";

const TONE_CLASS: Record<ChangeTone, string> = {
  up: "text-positive",
  down: "text-negative",
  flat: "text-text-sub",
};

const PERIODS = [
  { label: "1주", days: 7 },
  { label: "1달", days: 30 },
  { label: "3달", days: 90 },
  { label: "전체", days: null },
];

const ALLOCATION_LABEL: Record<string, string> = {
  STOCK: "주식",
  ETF: "ETF",
  CASH: "현금",
};

/** 비중이 큰 순서대로 쓰는 Figma 차트 색. 연한 3색은 토큰에 없어 직접 써요 (AGENTS.md 색 규칙 예외) */
const ALLOCATION_COLORS = [
  { stroke: "stroke-primary", dot: "bg-primary" },
  { stroke: "stroke-[#9b87f5]", dot: "bg-[#9b87f5]" },
  { stroke: "stroke-[#c7bbfa]", dot: "bg-[#c7bbfa]" },
  { stroke: "stroke-[#e3ddfc]", dot: "bg-[#e3ddfc]" },
];

/** 처음 보여주는 보유 종목 수 (Figma) */
const HOLDINGS_PREVIEW = 3;

/** 모의투자 포트폴리오 (PAPER-01). 총 평가금액 · 추이 · 자산 배분 · 보유 종목 */
export function PortfolioScreen() {
  const portfolio = useQuery({
    queryKey: sharedKeys.paperPortfolio,
    queryFn: () => getPaperPortfolio(),
  });

  if (portfolio.isPending) {
    return (
      <ScreenFrame>
        <p className="text-caption text-text-sub py-20 text-center">불러오는 중…</p>
      </ScreenFrame>
    );
  }
  if (portfolio.isError) {
    return (
      <ScreenFrame className="items-center gap-3 py-20">
        <p role="alert" className="text-caption text-danger">
          포트폴리오를 불러오지 못했어요.
        </p>
        <button
          type="button"
          onClick={() => void portfolio.refetch()}
          className="rounded-button bg-sub px-5 py-2"
        >
          <span className="text-caption text-primary font-semibold">다시 시도하기</span>
        </button>
      </ScreenFrame>
    );
  }

  const { data, meta } = portfolio.data;
  return (
    <ScreenFrame className="gap-4">
      <div className="flex h-11 shrink-0 items-center justify-between">
        <h1 className="text-title text-text-strong font-semibold">내 포트폴리오</h1>
        <span className="bg-sub text-caption text-primary rounded-[16px] px-3.5 py-1.5 font-semibold">
          모의투자
        </span>
      </div>

      <ValueCard portfolio={data} today={referenceDate(meta?.asOf)} />
      <AllocationCard allocation={data.allocation} />
      <HoldingsCard holdings={data.holdings} />

      <Link
        href="/invest"
        className="rounded-button bg-primary text-subtitle text-surface flex h-[60px] shrink-0 items-center justify-center font-semibold"
      >
        모의 매수 하러가기
      </Link>
      {/* AGENTS.md 금융 규칙의 필수 문구 (Figma 에는 없어요) */}
      <p className="text-caption text-text-sub text-center leading-[18px] font-light">
        가상 자금 · 실제 돈이 아니에요. 과거 결과이며 앞으로를 보장하지 않아요.
      </p>
    </ScreenFrame>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-card bg-surface shadow-card flex shrink-0 flex-col gap-2.5 px-[18px] py-5">
      {children}
    </section>
  );
}

function CardTitle({ title, action }: { title: string; action: ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      <h2 className="text-subtitle text-text-strong flex-1 font-semibold">{title}</h2>
      {action}
    </div>
  );
}

function ActionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-caption text-text-sub flex items-center gap-1">
      {children}
      <Image src={chevronRight} alt="" width={14} height={14} />
    </span>
  );
}

function ValueCard({ portfolio, today }: { portfolio: PaperPortfolio; today: string }) {
  const tone = changeTone(portfolio.profitLoss);
  const arrow = tone === "up" ? "▲ " : tone === "down" ? "▼ " : "";
  return (
    <Card>
      <div className="flex flex-col gap-1.5">
        <p className="text-caption text-text-sub font-medium">총 평가금액 · 가상 자금</p>
        <p className="text-text-strong text-[28px] font-bold">{formatKRW(portfolio.totalValue)}</p>
        <p className={cn("text-caption font-semibold", TONE_CLASS[tone])}>
          {arrow}
          {formatKRW(Math.abs(portfolio.profitLoss))} (
          {formatSignedPercent(portfolio.returnPercent)}) · 시작 대비
        </p>
      </div>
      <TrendChart today={today} />
    </Card>
  );
}

/** 평가금액 추이 ([명세 외] API). 기간을 바꾸는 동안에는 이전 선을 그대로 둬요 */
function TrendChart({ today }: { today: string }) {
  const [period, setPeriod] = useState(PERIODS[1]!);
  const from = period.days === null ? undefined : shiftDate(today, -period.days);
  const history = useQuery({
    queryKey: portfolioKeys.history(from, today),
    queryFn: async ({ signal }) => (await getPortfolioHistory(from, today, signal)).data.items,
    placeholderData: keepPreviousData,
  });
  const values = history.data?.map((point) => point.totalValue) ?? [];

  return (
    <>
      <div className="flex gap-2 pt-2">
        {PERIODS.map((item) => {
          const on = item === period;
          return (
            <button
              key={item.label}
              type="button"
              aria-pressed={on}
              onClick={() => setPeriod(item)}
              className={cn("rounded-[16px] px-4 py-2", on ? "bg-primary" : "bg-bg")}
            >
              <span
                className={cn(
                  "text-caption block font-medium",
                  on ? "text-surface" : "text-text-sub",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {values.length >= 2 ? (
        <svg
          role="img"
          aria-label={`평가금액 추이 ${period.label}`}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="text-primary h-24 w-[281px]"
        >
          <polygon
            points={`0,${CHART_HEIGHT} ${trendLine(values)} ${CHART_WIDTH},${CHART_HEIGHT}`}
            fill="currentColor"
            fillOpacity={0.08}
          />
          <polyline
            points={trendLine(values)}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : (
        <p
          role={history.isError ? "alert" : undefined}
          className={cn(
            "text-caption flex h-24 items-center justify-center",
            history.isError ? "text-danger" : "text-text-sub",
          )}
        >
          {history.isError
            ? "추이를 불러오지 못했어요."
            : history.isPending
              ? "불러오는 중…"
              : "아직 보여줄 추이가 없어요."}
        </p>
      )}
    </>
  );
}

function AllocationCard({ allocation }: { allocation: PaperAllocation[] }) {
  const items = allocation
    .filter((item) => item.weightPercent > 0)
    .sort((a, b) => b.weightPercent - a.weightPercent)
    .slice(0, ALLOCATION_COLORS.length);
  // 각 조각이 시작하는 위치 = 앞 조각들의 비중 합
  const starts = items.map((_, index) =>
    items.slice(0, index).reduce((sum, item) => sum + item.weightPercent, 0),
  );

  return (
    <Card>
      {/* [화면 없음] Figma 에 "자세히"로 이어지는 화면이 없어 글자만 둬요 (docs/figma-api-gaps.md) */}
      <CardTitle title="자산 배분" action={<ActionLabel>자세히</ActionLabel>} />
      <div className="flex items-center gap-6">
        <svg aria-hidden viewBox="0 0 120 120" className="size-[120px] shrink-0 -rotate-90">
          {items.map((item, index) => (
            <circle
              key={item.type}
              cx={60}
              cy={60}
              r={44}
              fill="none"
              strokeWidth={20}
              pathLength={100}
              strokeDasharray={`${item.weightPercent} ${100 - item.weightPercent}`}
              strokeDashoffset={-starts[index]!}
              className={ALLOCATION_COLORS[index]!.stroke}
            />
          ))}
        </svg>
        <ul className="flex min-w-0 flex-1 flex-col gap-4">
          {items.map((item, index) => (
            <li key={item.type} className="text-caption flex items-center gap-2">
              <span className={cn("size-2 rounded-full", ALLOCATION_COLORS[index]!.dot)} />
              <span className="text-text flex-1 font-medium">
                {ALLOCATION_LABEL[item.type] ?? item.type}
              </span>
              <span className="text-text-strong font-semibold">
                {formatPercent(item.weightPercent, 0)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function HoldingsCard({ holdings }: { holdings: Holding[] }) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = holdings.length > HOLDINGS_PREVIEW;
  const visible = expanded ? holdings : holdings.slice(0, HOLDINGS_PREVIEW);

  return (
    <Card>
      <CardTitle
        title="보유 종목"
        action={
          canExpand ? (
            <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
              <ActionLabel>{expanded ? "접기" : "전체"}</ActionLabel>
            </button>
          ) : (
            <ActionLabel>전체</ActionLabel>
          )
        }
      />
      {holdings.length === 0 ? (
        <p className="text-caption text-text-sub py-6 text-center">아직 보유한 종목이 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {visible.map((holding) => (
            <li key={holding.instrumentId}>
              <HoldingRow holding={holding} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function HoldingRow({ holding }: { holding: Holding }) {
  const percent = holding.profitLossPercent;
  return (
    <Link href={`/invest/${holding.instrumentId}`} className="flex items-center gap-3">
      <InstrumentLogo name={holding.name} />
      <span className="flex min-w-0 flex-1 flex-col gap-1.5 font-medium">
        <span className="text-subtitle text-text truncate">{holding.name}</span>
        <span className="text-caption text-text-sub">{holding.quantity}주</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-subtitle text-text-strong font-semibold">
          {formatKRW(holding.marketValue)}
        </span>
        <span className={cn("text-caption font-medium", TONE_CLASS[changeTone(percent)])}>
          {percent === null ? "-" : formatArrowPercent(percent)}
        </span>
      </span>
    </Link>
  );
}
