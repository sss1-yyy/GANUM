"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { USE_MOCK } from "@/shared/api";
import { getMe } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { cn } from "@/shared/lib/cn";
import { daysUntil, formatDDay } from "@/shared/lib/format";
import { referenceDate } from "@/shared/lib/format-time";
import type { Benefit } from "@/shared/types";
import { benefitKeys, getBenefits } from "../api";

const FILTERS = ["전체", "저축", "주거", "교통", "문화"] as const;
type Filter = (typeof FILTERS)[number];

function matchesFilter(benefit: Benefit, filter: Filter) {
  switch (filter) {
    case "전체":
      return true;
    case "저축":
      return benefit.category === "SAVING";
    case "주거":
      return benefit.category === "HOUSING";
    // [명세 외] 교통·문화 분류가 없어 OTHER 항목의 제목으로 임시 구분해요.
    case "교통":
    case "문화":
      return benefit.category === "OTHER" && benefit.title.includes(filter);
  }
}

const categoryIconPaths = {
  저축: "M7 11V8a5 5 0 0 1 10 0v3 M6 11h12v10H6z M12 15v2",
  주거: "m3 11 9-8 9 8 M5 10v11h14V10 M10 21v-6h4v6",
  교통: "M5 7h14v11H5z M5 11h14 M8 18v3m8-3v3 M8 15h.01M16 15h.01",
  문화: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z",
} as const;

const iconCategories = ["저축", "주거", "교통", "문화"] as const;

function BenefitCategoryIcon({ benefit }: { benefit: Benefit }) {
  const category = iconCategories.find((option) => matchesFilter(benefit, option));
  if (!category) return null;

  return (
    <span className="bg-sub text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path d={categoryIconPaths[category]} />
      </svg>
    </span>
  );
}

function statusLabel(benefit: Benefit, today: string) {
  switch (benefit.applicationStatus) {
    case "ALWAYS":
      return "상시";
    case "UPCOMING":
      return "신청 예정";
    case "CLOSED":
      return "마감";
    case "UNKNOWN":
      return "확인 필요";
    case "OPEN":
      return benefit.deadline ? formatDDay(daysUntil(benefit.deadline, today)) : "신청 중";
  }
}

export function BenefitListScreen() {
  const [filter, setFilter] = useState<Filter>("전체");
  const { data: me } = useQuery({
    queryKey: sharedKeys.me,
    queryFn: getMe,
  });
  const nickname = me?.data.nickname.trim();
  const query = useInfiniteQuery({
    queryKey: benefitKeys.list(),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => getBenefits({ cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
  });

  const pages = query.data?.pages ?? [];
  const benefits = pages.flatMap((page) =>
    page.data.items.map((benefit) => ({
      benefit,
      today: referenceDate(page.meta?.asOf),
    })),
  );
  const visible = benefits.filter(({ benefit }) => matchesFilter(benefit, filter));

  return (
    <ScreenFrame className="gap-4">
      <h1 className="text-title text-text-strong font-bold">청년 혜택</h1>

      {query.isPending ? (
        <p role="status">혜택을 불러오고 있어요.</p>
      ) : query.isError && !query.data ? (
        <div className="space-y-2">
          <p role="alert" className="text-danger">
            혜택을 불러오지 못했어요.
          </p>
          <button type="button" className="text-primary" onClick={() => void query.refetch()}>
            다시 시도
          </button>
        </div>
      ) : (
        <>
          <div className="from-primary to-primary-light text-surface rounded-card bg-linear-to-r p-5">
            <p className="text-caption">
              {nickname ? `${nickname}님이 받을 수 있는 혜택` : "청년을 위한 혜택"}
            </p>
            <p className="text-title mt-1 font-bold">{benefits.length}개의 혜택을 찾았어요</p>
          </div>

          <div role="group" aria-label="혜택 분류" className="flex flex-wrap gap-2">
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={filter === option}
                onClick={() => setFilter(option)}
                className={cn(
                  "rounded-full px-3 py-2",
                  filter === option ? "bg-primary text-surface" : "bg-bg text-text-sub",
                )}
              >
                <span className="text-caption font-semibold">{option}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="text-text-sub">
              {query.hasNextPage
                ? "불러온 목록에 이 분류의 혜택이 없어요."
                : "이 분류의 혜택이 없어요."}
            </p>
          ) : (
            <ul className="space-y-3">
              {visible.map(({ benefit, today }) => (
                <li key={benefit.id}>
                  <Link
                    href={`/benefits/${encodeURIComponent(benefit.id)}`}
                    className="bg-surface shadow-card rounded-card flex items-center gap-3 p-4"
                  >
                    <BenefitCategoryIcon benefit={benefit} />
                    <div className="min-w-0 flex-1">
                      <p className="text-text-strong font-bold">{benefit.title}</p>
                      <p className="text-caption text-text-sub mt-1">
                        {USE_MOCK ? "[예시] " : ""}
                        {benefit.summary}
                      </p>
                    </div>
                    <span className="bg-sub text-primary text-caption shrink-0 rounded-full px-2 py-1">
                      {statusLabel(benefit, today)}
                    </span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-text-sub size-4 shrink-0"
                    >
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {query.isFetchNextPageError && (
            <p role="alert" className="text-danger">
              다음 혜택을 불러오지 못했어요. 다시 눌러 주세요.
            </p>
          )}
          {query.hasNextPage && (
            <button
              type="button"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
              className="border-line rounded-button border px-4 py-3"
            >
              {query.isFetchingNextPage ? "불러오는 중이에요" : "혜택 더 보기"}
            </button>
          )}
        </>
      )}
    </ScreenFrame>
  );
}
