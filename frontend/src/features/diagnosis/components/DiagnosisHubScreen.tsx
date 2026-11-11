"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { InstrumentLogo } from "@/components/domain/InstrumentLogo";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { isApiError } from "@/shared/api";
import { getInstruments, getLatestInvestmentProfile, getMe } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { cn } from "@/shared/lib/cn";
import { changeTone, formatKRW, formatNumber, formatSignedPercent } from "@/shared/lib/format";
import type { InvestmentProfile } from "@/shared/types";
import chevronLeftPrimary from "../assets/chevron-left-primary.svg";
import stocksGrowth from "../assets/stocks-growth.png";
import { TYPE_VIEW } from "../labels";

/** 랭킹에 보여줄 종목 수. 전체는 랭킹 화면(/market)에서 봐요 */
const RANKING_LIMIT = 5;

/** 정렬 탭. "인기"는 API 에 없어서 거래대금 정렬로 대신해요 (docs/figma-api-gaps.md) */
const SORT_TABS = [
  { key: "TRADING_VALUE", label: "거래대금", sort: "TRADING_VALUE" },
  { key: "VOLUME", label: "거래량", sort: "VOLUME" },
  { key: "GAINERS", label: "급상승", sort: "GAINERS" },
  { key: "LOSERS", label: "급하락", sort: "LOSERS" },
  { key: "POPULAR", label: "인기", sort: "TRADING_VALUE" },
] as const;

type SortTabKey = (typeof SORT_TABS)[number]["key"];

/** 진단 전 카드에 2×2 로 놓는 캐릭터 순서 (Figma: 도전형·균형형 / 신중형·자유형) */
const INTRO_CHARACTERS = ["BOLD", "BALANCED", "CAUTIOUS", "FREE"] as const;

/** 상승 빨강 · 하락 파랑 · 보합 회색 */
function toneClass(value: number | null | undefined): string {
  const tone = changeTone(value);
  if (tone === "up") return "text-positive";
  if (tone === "down") return "text-negative";
  return "text-text-muted";
}

/** 1240000 → "124만주" (만 주 아래는 버려요) */
function formatManShares(volume: number): string {
  return volume >= 10_000
    ? `${formatNumber(Math.floor(volume / 10_000))}만주`
    : `${formatNumber(volume)}주`;
}

/**
 * 성향 진단 (Figma "성향 진단_거래대금" 628:790, "성향 진단 완료 _ ○○형" 289:1008 등).
 * 맨 위 카드만 진단 결과(PROFILE-03)에 따라 바뀌고, 아래는 모의투자 안내와 종목 랭킹(MARKET-01)이에요.
 */
export function DiagnosisHubScreen() {
  const profile = useQuery({
    queryKey: sharedKeys.latestProfile,
    queryFn: async () => (await getLatestInvestmentProfile()).data,
  });
  const me = useQuery({ queryKey: sharedKeys.me, queryFn: async () => (await getMe()).data });

  return (
    <ScreenFrame tabBar className="gap-4">
      {profile.isPending ? (
        <div aria-busy className="rounded-card bg-sub h-[110px] shrink-0" />
      ) : profile.data ? (
        <ProfileCard profile={profile.data} nickname={me.data?.nickname} />
      ) : (
        // 결과를 못 불러온 경우도 진단을 권하는 카드를 보여줘요
        <DiagnoseCard />
      )}

      <section className="rounded-card bg-bg relative flex h-[146px] shrink-0 flex-col justify-between px-[18px] pt-2 pb-5">
        <h2 className="text-subtitle text-text mt-2 leading-6 font-semibold">
          모의 투자로
          <br />
          연습해 볼까요?
        </h2>
        <Image
          src={stocksGrowth}
          alt=""
          width={82}
          height={82}
          className="absolute top-3 right-[30px]"
        />
        <Link
          href="/invest"
          // 버튼 색: Figma 진한 남색(#191f28) — 이 버튼에만 쓰여 토큰에 없음
          className="text-subtitle flex h-[42px] w-[162px] items-center justify-center rounded-[16px] bg-[#191f28] leading-[26px] font-bold text-white"
        >
          모의투자 하러 가기
        </Link>
      </section>

      <Ranking />
    </ScreenFrame>
  );
}

/** 진단 전: "내 투자 성향을 진단해 볼까요?" + 진단하러 가기 + 캐릭터 4개 */
function DiagnoseCard() {
  return (
    <section className="rounded-card bg-sub relative flex h-[146px] shrink-0 flex-col justify-between px-[18px] pt-5 pb-5">
      <h2 className="text-subtitle text-text leading-6 font-semibold">
        내 투자 성향을
        <br />
        진단해 볼까요?
      </h2>
      <ul
        aria-hidden
        className="absolute top-[21px] right-[30px] grid grid-cols-2 gap-x-[6px] gap-y-[3px]"
      >
        {INTRO_CHARACTERS.map((type) => (
          <li key={type} className="flex size-[49px] items-center justify-center">
            <Image
              src={TYPE_VIEW[type].character}
              alt=""
              // 신중형 그림은 여백이 있어 Figma 에서도 조금 크게(55px) 놓여 있어요
              className={type === "CAUTIOUS" ? "size-[55px] max-w-none" : "size-[49px]"}
            />
          </li>
        ))}
      </ul>
      <Link
        href="/diagnosis"
        className="bg-primary text-subtitle flex h-[42px] w-[140px] items-center justify-center rounded-[16px] leading-[26px] font-bold text-white"
      >
        진단하러 가기
      </Link>
    </section>
  );
}

/** 진단 후: 내 캐릭터 + "○○님은 ○○형이에요" + 한 줄 소개 + 레포트 보기 */
function ProfileCard({ profile, nickname }: { profile: InvestmentProfile; nickname?: string }) {
  const view = TYPE_VIEW[profile.type];
  return (
    <section
      className={cn(
        "rounded-card to-sub relative flex h-[110px] shrink-0 items-center gap-2 bg-linear-to-r pr-[14px] pl-[18px]",
        view.resultClass,
      )}
    >
      <Image src={view.character} alt="" className="size-[70px] shrink-0" />
      <div className="ml-1 flex min-w-0 flex-1 flex-col">
        <p className="text-subtitle text-text leading-6 font-semibold">
          {nickname ? `${nickname}님은 ` : "나는 "}
          <span className="text-primary font-bold">{profile.typeLabel}</span>이에요
        </p>
        <p className="text-text text-[14px] leading-6 tracking-[-0.35px]">{view.tagline}</p>
      </div>
      <Link
        href="/report"
        className="text-caption text-primary flex shrink-0 items-center gap-1 leading-[19px] font-medium"
      >
        레포트 보기
        <Image src={chevronLeftPrimary} alt="" width={10} height={10} className="-scale-x-100" />
      </Link>
    </section>
  );
}

/** 종목 랭킹 5개 (MARKET-01). 순위 1~3 은 보라색이고, 오른쪽에 거래량을 보여줘요 (Figma) */
function Ranking() {
  const [tab, setTab] = useState<SortTabKey>("TRADING_VALUE");
  const sort = SORT_TABS.find((item) => item.key === tab)?.sort ?? "TRADING_VALUE";
  const instruments = useQuery({
    queryKey: sharedKeys.instruments({ sort, limit: RANKING_LIMIT }),
    queryFn: () => getInstruments({ sort, limit: RANKING_LIMIT }),
  });

  return (
    <section className="mt-5 flex shrink-0 flex-col">
      <div
        role="tablist"
        aria-label="종목 정렬"
        className="border-outline flex justify-between border-b"
      >
        {SORT_TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              "text-subtitle relative pb-[6px] leading-6 font-medium tracking-[-0.4px]",
              tab === item.key ? "text-text-strong" : "text-text-muted",
            )}
          >
            {item.label}
            {tab === item.key && (
              <span aria-hidden className="bg-text-strong absolute inset-x-0 -bottom-px h-px" />
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
            {isApiError(instruments.error)
              ? instruments.error.message
              : "종목 목록을 불러오지 못했어요."}
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
          <ol className="mt-6 flex flex-col gap-4">
            {instruments.data.data.items.map((item, rank) => (
              <li key={item.id}>
                <Link href={`/invest/${item.id}`} className="flex items-center gap-[11px]">
                  <span
                    className={cn(
                      "text-subtitle w-3 shrink-0 leading-[22px] font-semibold",
                      rank < 3 ? "text-primary" : "text-text-strong",
                    )}
                  >
                    {rank + 1}
                  </span>
                  <InstrumentLogo instrumentId={item.id} name={item.name} />
                  <span className="ml-1 flex min-w-0 flex-1 flex-col">
                    <span className="text-subtitle text-text truncate leading-[22px] font-semibold tracking-[-0.4px]">
                      {item.name}
                    </span>
                    <span className="text-caption leading-[22px] font-medium tracking-[-0.3px]">
                      <span className="text-text-muted">{formatKRW(item.price)} </span>
                      <span className={toneClass(item.changePercent)}>
                        {formatSignedPercent(item.changePercent)}
                      </span>
                    </span>
                  </span>
                  <span className="text-caption text-text-sub shrink-0 leading-[22px] font-medium tracking-[-0.3px]">
                    {formatManShares(item.volume)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          <Link
            href="/market"
            className="text-caption text-text-muted mt-3 py-2 text-center leading-6 font-medium"
          >
            더보기
          </Link>
        </>
      )}
    </section>
  );
}
