"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { getGoal, getInstruments, getPaperPortfolio } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { cn } from "@/shared/lib/cn";
import { changeTone, formatKRW, formatSignedPercent } from "@/shared/lib/format";
import type { PaperAllocation } from "@/shared/types";
import { InstrumentLogo } from "./InstrumentLogo";

/** 메인에 보여줄 종목 수. 전체 목록은 랭킹 화면(/market)에서 봐요 */
const RANKING_LIMIT = 5;

/** 종목 정렬 탭. "인기"는 API 에 없어서 거래대금 정렬로 대신해요 (docs/figma-api-gaps.md) */
const SORT_TABS = [
  { key: "TRADING_VALUE", label: "거래대금", sort: "TRADING_VALUE" },
  { key: "VOLUME", label: "거래량", sort: "VOLUME" },
  { key: "GAINERS", label: "급상승", sort: "GAINERS" },
  { key: "LOSERS", label: "급하락", sort: "LOSERS" },
  { key: "POPULAR", label: "인기", sort: "TRADING_VALUE" },
] as const;

type SortTabKey = (typeof SORT_TABS)[number]["key"];

/** 도넛·범례 색 (진한 보라 → 연한 보라 순서, Figma 포트폴리오 카드) */
const ALLOCATION_COLORS = ["#6a4cf0", "#8a70ff", "#c3b2ff", "#e5deff", "#d1c7f8"];

/** PAPER-01 allocation.type → 화면 이름 */
const ALLOCATION_LABELS: Record<string, string> = {
  STOCK: "주식",
  ETF: "ETF",
  CASH: "현금",
  BOND: "채권",
  DEPOSIT: "예금",
  SAVING: "적금",
};

/** 상승 빨강 · 하락 파랑 · 보합 회색 */
function toneClass(value: number | null | undefined): string {
  const tone = changeTone(value);
  if (tone === "up") return "text-positive";
  if (tone === "down") return "text-negative";
  return "text-text-muted";
}

/** 모의투자 메인 (PAPER-01 + GOAL-01 + MARKET-01) */
export function InvestScreen() {
  const [tab, setTab] = useState<SortTabKey>("TRADING_VALUE");
  const [liked, setLiked] = useState<ReadonlySet<string>>(new Set());

  const sort = SORT_TABS.find((item) => item.key === tab)?.sort ?? "TRADING_VALUE";

  const portfolio = useQuery({
    queryKey: sharedKeys.paperPortfolio,
    queryFn: () => getPaperPortfolio(),
  });
  const goal = useQuery({ queryKey: sharedKeys.goal, queryFn: () => getGoal() });
  const instruments = useQuery({
    queryKey: sharedKeys.instruments({ sort, limit: RANKING_LIMIT }),
    queryFn: () => getInstruments({ sort, limit: RANKING_LIMIT }),
  });

  /** 하트는 명세에 저장 API 가 없어서 화면 안 임시 상태예요 (docs/figma-api-gaps.md) */
  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
          모의투자 정보를 불러오지 못했어요.
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

  const paper = portfolio.data.data;
  const goalData = goal.data?.data ?? null;
  // Figma 문구 그대로 "가상 자금(현금) ÷ 목표" 로 계산해요 (docs/figma-api-gaps.md)
  const goalPercent = goalData
    ? Math.min(100, Math.round((paper.cashBalance / goalData.targetAmount) * 100))
    : 0;
  const goalRemaining = goalData ? Math.max(0, goalData.targetAmount - paper.cashBalance) : 0;

  return (
    <ScreenFrame className="gap-4">
      <h1 className="text-title text-text-strong font-bold">모의 투자</h1>

      {/* 가상 자금 — Figma 금액은 주문 가능 금액(현금) 기준 (docs/figma-api-gaps.md) */}
      <section className="rounded-card bg-gradient-to-br from-[#efebfd] to-[#e3dcfb] px-5 py-4">
        <p className="text-caption text-text-sub">가상 자금 · 실제 돈이 아니에요</p>
        <p className="text-text-strong mt-1 text-[26px] leading-tight font-bold">
          {formatKRW(paper.cashBalance)}
        </p>
        <p className="text-caption mt-1">
          <span className="text-text-sub">수익률 </span>
          <span className={cn("font-semibold", toneClass(paper.returnPercent))}>
            {formatSignedPercent(paper.returnPercent)}
          </span>
        </p>
      </section>

      {/* 금융 목표 (GOAL-01) — 미설정이면 숨겨요 */}
      {goalData && (
        <section className="rounded-card border-line border p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-text-strong font-semibold">
              목표 {formatKRW(goalData.targetAmount)}
            </p>
            <p className="text-caption text-text-sub">{goalPercent}%</p>
          </div>
          <div className="bg-chip-gray mt-2.5 h-1.5 overflow-hidden rounded-full">
            <div className="bg-primary h-full rounded-full" style={{ width: `${goalPercent}%` }} />
          </div>
          <p className="text-caption text-text-sub mt-2.5">
            {goalRemaining > 0
              ? `목표 달성까지 ${formatKRW(goalRemaining)} 남았어요`
              : "목표를 달성했어요!"}
          </p>
        </section>
      )}

      {/* 내 포트폴리오 (PAPER-01 allocation) */}
      <section className="rounded-card border-line border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-text-strong font-semibold">내 포트폴리오</h2>
          <Link href="/portfolio" className="text-caption text-text-muted">
            더보기 &gt;
          </Link>
        </div>
        <div className="mt-4 flex items-center gap-6">
          <AllocationDonut allocation={paper.allocation} />
          <ul className="flex flex-1 flex-col gap-2">
            {paper.allocation.map((slice, index) => (
              <li key={slice.type} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length] }}
                />
                <span className="text-caption text-text-sub flex-1">
                  {ALLOCATION_LABELS[slice.type] ?? slice.type}
                </span>
                <span className="text-caption text-text-strong font-semibold">
                  {Math.round(slice.weightPercent)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 레포트 · 시뮬레이션 바로가기 */}
      <section className="grid grid-cols-2 gap-3">
        <Link href="/report" className="rounded-card border-line flex flex-col gap-2 border p-4">
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="text-primary size-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5" />
            <path d="M9 13h6M9 17h4" />
          </svg>
          <span className="text-text-strong font-semibold">레포트</span>
          <span className="text-caption text-text-muted">내 성향 맞춤 조언 받기</span>
        </Link>
        <Link
          href="/simulation"
          className="rounded-card border-line flex flex-col gap-2 border p-4"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="text-primary size-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 17l6-6 4 4 7-7" />
            <path d="M14 8h6v6" />
          </svg>
          <span className="text-text-strong font-semibold">시뮬레이션</span>
          <span className="text-caption text-text-muted">만약 다른 선택을 했다면?</span>
        </Link>
      </section>

      {/* 종목 목록 (MARKET-01) */}
      <section className="flex flex-col">
        <div
          role="tablist"
          aria-label="종목 정렬"
          className="no-scrollbar border-line -mx-8 flex gap-5 overflow-x-auto border-b px-8"
        >
          {SORT_TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={cn(
                "relative shrink-0 pb-2 text-[15px]",
                tab === item.key ? "text-text-strong font-bold" : "text-text-muted font-medium",
              )}
            >
              {item.label}
              {tab === item.key && (
                <span aria-hidden className="bg-text-strong absolute inset-x-0 bottom-0 h-0.5" />
              )}
            </button>
          ))}
        </div>

        {instruments.isPending && (
          <p className="text-caption text-text-sub py-10 text-center">불러오는 중…</p>
        )}
        {instruments.isError && (
          <div className="flex flex-col items-center gap-3 py-10">
            <p role="alert" className="text-caption text-danger">
              종목 목록을 불러오지 못했어요.
            </p>
            <button
              type="button"
              onClick={() => void instruments.refetch()}
              className="rounded-button bg-sub px-5 py-2"
            >
              <span className="text-caption text-primary font-semibold">다시 시도하기</span>
            </button>
          </div>
        )}
        {instruments.isSuccess && (
          <>
            <ul className="flex flex-col">
              {instruments.data.data.items.map((item) => (
                <li
                  key={item.id}
                  className="border-line flex items-center gap-3 border-b py-3 last:border-b-0"
                >
                  <Link
                    href={`/invest/${item.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <InstrumentLogo symbol={item.symbol} name={item.name} />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-text-strong truncate font-medium">{item.name}</span>
                      <span className="text-caption">
                        <span className="text-text-sub">{formatKRW(item.price)} </span>
                        <span className={cn("font-semibold", toneClass(item.changePercent))}>
                          {formatSignedPercent(item.changePercent)}
                        </span>
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-label={liked.has(item.id) ? "관심 종목 해제" : "관심 종목 등록"}
                    aria-pressed={liked.has(item.id)}
                    onClick={() => toggleLike(item.id)}
                    className="p-1"
                  >
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      className={cn(
                        "size-6",
                        liked.has(item.id) ? "text-positive" : "text-outline",
                      )}
                      fill={liked.has(item.id) ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
            <Link href="/market" className="text-caption text-text-muted py-3 text-center">
              더보기
            </Link>
          </>
        )}
      </section>
    </ScreenFrame>
  );
}

/** 자산 배분 도넛 차트 (weightPercent 비율) */
function AllocationDonut({ allocation }: { allocation: PaperAllocation[] }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  // 렌더 중 변수 재할당을 피하려고 조각별 시작 위치를 먼저 계산해요
  const segments = allocation.reduce<{ items: Segment[]; start: number }>(
    (state, slice) => {
      const length = (Math.max(0, slice.weightPercent) / 100) * circumference;
      state.items.push({ type: slice.type, length, start: state.start });
      state.start += length;
      return state;
    },
    { items: [], start: 0 },
  ).items;

  return (
    <svg viewBox="0 0 112 112" className="size-28 shrink-0 -rotate-90" aria-hidden>
      {segments.map((segment, index) => (
        <circle
          key={segment.type}
          cx={56}
          cy={56}
          r={radius}
          fill="none"
          stroke={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]}
          strokeWidth={16}
          strokeDasharray={`${segment.length} ${circumference - segment.length}`}
          strokeDashoffset={-segment.start}
        />
      ))}
    </svg>
  );
}

interface Segment {
  type: string;
  length: number;
  start: number;
}
