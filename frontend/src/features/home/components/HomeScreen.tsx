"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { getAssetHistory } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { cn } from "@/shared/lib/cn";
import { changeTone, daysUntil, formatDDay, formatKRW, formatManWon } from "@/shared/lib/format";
import { referenceDate, shiftDate } from "@/shared/lib/format-time";
import type { AssetSummary, Benefit } from "@/shared/types";
import { getHome, homeKeys } from "../api";
import chevronRightSmall from "../assets/chevron-right-small.svg";
import chevronRight from "../assets/chevron-right.svg";
import coachCheeks from "../assets/coach-cheeks.svg";
import coachFace from "../assets/coach-face.svg";
import triangleUp from "../assets/triangle-up.svg";
import type { CoachCard } from "../types";

/** 홈 (HOME-01). 진단 안내 · 인사 · 오늘의 AI 코치 · 내 총 자산 · 나에게 맞는 혜택 */
export function HomeScreen() {
  const home = useQuery({
    queryKey: homeKeys.dashboard,
    queryFn: ({ signal }) => getHome(signal),
  });

  if (home.isPending) {
    return (
      <ScreenFrame hideBack tabBar>
        <p className="text-caption text-text-sub py-20 text-center">불러오는 중…</p>
      </ScreenFrame>
    );
  }
  if (home.isError) {
    return (
      <ScreenFrame hideBack tabBar className="items-center gap-3 py-20">
        <p role="alert" className="text-caption text-danger">
          홈 정보를 불러오지 못했어요.
        </p>
        <button
          type="button"
          onClick={() => void home.refetch()}
          className="rounded-button bg-sub px-5 py-2"
        >
          <span className="text-caption text-primary font-semibold">다시 시도하기</span>
        </button>
      </ScreenFrame>
    );
  }

  const { data, meta } = home.data;
  const today = referenceDate(meta?.asOf);

  return (
    <ScreenFrame hideBack tabBar className="pt-0">
      {data.investmentProfile === null && (
        <Link
          href="/diagnosis"
          className="bg-sub -mx-8 flex h-[50px] shrink-0 items-center justify-between px-8"
        >
          <span className="text-subtitle text-primary leading-6 font-medium">
            내 투자 성향을 진단 해 보세요
          </span>
          <Image src={chevronRight} alt="" className="-scale-x-100" />
        </Link>
      )}

      <h1 className="text-title text-text-strong mt-4 leading-8 font-semibold">
        안녕하세요, {data.user.nickname}님
      </h1>

      <CoachCardView card={data.coachCard} />
      <AssetCard summary={data.assetSummary} today={today} />
      <Benefits benefits={data.benefits} today={today} />
    </ScreenFrame>
  );
}

function CoachCardView({ card }: { card: CoachCard }) {
  return (
    <section className="rounded-card from-primary to-primary-light relative mt-4 flex shrink-0 flex-col overflow-hidden bg-linear-132 from-2% to-76% px-[18px] pt-5 pb-5">
      {/* 캐릭터 얼굴 장식 */}
      <Image src={coachFace} alt="" className="absolute top-[22.67px] right-[25.94px]" />
      <Image src={coachCheeks} alt="" className="absolute top-[49.38px] right-[17px]" />

      <span className="bg-coach text-caption text-surface relative self-start rounded-[16px] px-[15px] leading-[26px] font-semibold">
        오늘의 AI 코치
      </span>
      {/* Figma 처럼 문장마다 줄을 바꿔요 */}
      <p className="text-subtitle text-surface relative mt-4 leading-6 font-semibold">
        {card.question.split(/(?<=[.?!])\s+/).map((sentence) => (
          <span key={sentence} className="block">
            {sentence}
          </span>
        ))}
      </p>
      {/* [챗봇 연결 전] 챗봇 시트(B 담당)가 생기면 card.contextType 으로 대화를 열어요 */}
      <button type="button" className="bg-surface relative mt-3.5 h-12 w-full rounded-[16px]">
        <span className="text-subtitle text-primary leading-[26px] font-bold">쉽게 설명 듣기</span>
      </button>
    </section>
  );
}

function AssetCard({ summary, today }: { summary: AssetSummary; today: string }) {
  const change = summary.monthlyChangeAmount;
  const tone = changeTone(change);

  return (
    <Link
      href="/assets"
      className="rounded-card bg-surface shadow-card relative mt-4 flex h-[116px] shrink-0 flex-col px-[17px] pt-5"
    >
      <span className="text-caption text-text-sub flex items-center gap-1 leading-4 font-medium">
        내 총 자산
        <Image src={chevronRightSmall} alt="" className="-scale-x-100" />
      </span>
      <span className="text-text-strong mt-3 text-[24px] leading-7 font-bold">
        {formatKRW(summary.totalAssets)}
      </span>
      {change !== null && (
        <span className="text-caption mt-1 flex items-center gap-[3px] leading-4 font-medium">
          {tone === "up" && <Image src={triangleUp} alt="" />}
          {tone === "down" && <span className="text-negative">▼</span>}
          <span className={tone === "down" ? "text-negative" : "text-positive"}>
            {formatManWon(change)}
          </span>
          <span className="text-text-sub">지난 달 대비</span>
        </span>
      )}
      {summary.connectionStatus !== "NOT_CONNECTED" && <AssetSparkline today={today} />}
    </Link>
  );
}

/** 최근 3달 순자산 흐름 (ASSET-04). 보름 간격 점을 이어 그려요 */
function AssetSparkline({ today }: { today: string }) {
  const from = shiftDate(today, -90);
  const history = useQuery({
    queryKey: sharedKeys.assetHistory(from, today),
    queryFn: async () => (await getAssetHistory(from, today)).data.items,
  });
  const points = history.data?.filter(
    (_, index, items) => index % 15 === 0 || index === items.length - 1,
  );
  if (!points || points.length < 2) return null;

  const width = 125;
  const height = 35;
  const values = points.map((point) => point.netAssets);
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const path = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${width} ${height}`}
      overflow="visible"
      className="text-primary absolute top-[41px] right-[29px] h-[35px] w-[125px]"
    >
      <polyline
        points={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Benefits({ benefits, today }: { benefits: Benefit[]; today: string }) {
  return (
    <section className="mt-6 flex shrink-0 flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-subtitle text-text-strong leading-6 font-medium">나에게 맞는 혜택</h2>
        <Link
          href="/benefits"
          className="text-caption text-text-sub flex items-center leading-[19px] font-medium"
        >
          더보기
          <Image src={chevronRightSmall} alt="" className="-scale-x-100" />
        </Link>
      </div>
      {benefits.length === 0 ? (
        <p className="text-caption text-text-sub py-6">지금 보여줄 혜택이 없어요.</p>
      ) : (
        // 카드 그림자가 잘리지 않도록 위아래 여백을 두고 옆으로 넘겨 봐요
        <ul className="no-scrollbar -mx-8 flex gap-3.5 overflow-x-auto px-8 pt-3 pb-4">
          {benefits.map((benefit) => (
            <li key={benefit.id} className="shrink-0">
              <Link
                href={`/benefits/${benefit.id}`}
                className="rounded-card bg-surface shadow-card flex h-[118px] w-[174px] flex-col px-[18px] pt-[18px]"
              >
                <BenefitChip benefit={benefit} today={today} />
                <span className="text-subtitle text-text-strong mt-2.5 truncate leading-6 font-medium">
                  {benefit.title}
                </span>
                <span className="text-caption text-text-sub truncate leading-[19px] font-medium">
                  {benefit.summary}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function BenefitChip({ benefit, today }: { benefit: Benefit; today: string }) {
  const label = benefitStatusLabel(benefit, today);
  const highlight = benefit.applicationStatus === "OPEN" && benefit.deadline !== null;
  return (
    <span
      className={cn(
        "text-caption self-start rounded-[16px] px-3 leading-[27px] font-bold",
        highlight ? "bg-sub text-primary" : "bg-chip-gray text-text-sub",
      )}
    >
      {label}
    </span>
  );
}

function benefitStatusLabel(benefit: Benefit, today: string): string {
  switch (benefit.applicationStatus) {
    case "ALWAYS":
      return "상시";
    case "UPCOMING":
      return "오픈 예정";
    case "CLOSED":
      return "마감";
    case "UNKNOWN":
      return "확인 필요";
    case "OPEN":
      return benefit.deadline ? formatDDay(daysUntil(benefit.deadline, today)) : "신청 중";
  }
}
