"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { getMe } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { cn } from "@/shared/lib/cn";
import { daysUntil, formatDDay } from "@/shared/lib/format";
import { referenceDate } from "@/shared/lib/format-time";
import type { Benefit } from "@/shared/types";
import { benefitKeys, getBenefits } from "../api";
import Image from "next/image";
import chevronRight from "../assets/chevron-right.svg";
import cultureIcon from "../assets/culture.svg";
import housingIcon from "../assets/housing.svg";
import savingIcon from "../assets/saving.svg";
import transitIcon from "../assets/transit.svg";

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

const categoryIcons = {
  저축: savingIcon,
  주거: housingIcon,
  교통: transitIcon,
  문화: cultureIcon,
};

const iconCategories = ["저축", "주거", "교통", "문화"] as const;

function BenefitCategoryIcon({ benefit }: { benefit: Benefit }) {
  const category = iconCategories.find((option) => matchesFilter(benefit, option));

  if (category) {
    return (
      <Image src={categoryIcons[category]} alt="" width={40} height={40} className="shrink-0" />
    );
  }

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
        <path d="M4 11h16v10H4z M3 7h18v4H3z M12 7v14 M12 7H8.5A2.5 2.5 0 1 1 11 4.5L12 7Zm0 0h3.5A2.5 2.5 0 1 0 13 4.5L12 7Z" />
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
                      <p className="text-caption text-text-sub mt-1">{benefit.summary}</p>
                    </div>
                    <span className="bg-sub text-primary text-caption shrink-0 rounded-full px-2 py-1">
                      {statusLabel(benefit, today)}
                    </span>
                    <Image src={chevronRight} alt="" width={7} height={12} className="shrink-0" />
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
