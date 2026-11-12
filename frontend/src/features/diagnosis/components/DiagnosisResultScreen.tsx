"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { getLatestInvestmentProfile, getMe } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { cn } from "@/shared/lib/cn";
import type { InvestmentProfile } from "@/shared/types";
import iconDollarCoin from "../assets/icon-dollar-coin.png";
import iconIdea from "../assets/icon-idea.png";
import iconSiren from "../assets/icon-siren.png";
import { TYPE_VIEW, ctaClass } from "../labels";
import {
  AXIS_LEGEND,
  MBTI_RESULTS,
  RESULT_DISCLAIMER,
  TYPE_ABOUT,
  codesOfType,
  isMbtiCode,
} from "../results";

/** 진단 결과 (PROFILE-03 최근 결과). 진단 직후에는 제출 응답을 그대로 보여줘요 */
export function DiagnosisResultScreen() {
  const profile = useQuery({
    queryKey: sharedKeys.latestProfile,
    queryFn: async () => (await getLatestInvestmentProfile()).data,
  });

  if (profile.isPending) {
    return (
      <ScreenFrame tabBar>
        <p className="text-caption text-text-sub py-20 text-center">불러오는 중…</p>
      </ScreenFrame>
    );
  }
  if (profile.isError) {
    return (
      <ScreenFrame tabBar className="items-center gap-3 py-20">
        <p role="alert" className="text-caption text-danger">
          결과를 불러오지 못했어요.
        </p>
        <button
          type="button"
          onClick={() => void profile.refetch()}
          className="rounded-button bg-sub px-5 py-2"
        >
          <span className="text-caption text-primary font-semibold">다시 시도하기</span>
        </button>
      </ScreenFrame>
    );
  }
  if (profile.data === null) {
    return (
      <ScreenFrame tabBar className="items-center gap-4 py-20">
        <p className="text-subtitle text-text-sub">아직 진단한 결과가 없어요.</p>
        <Link href="/diagnosis" className={ctaClass()}>
          진단하러 가기
        </Link>
      </ScreenFrame>
    );
  }
  return <Result profile={profile.data} />;
}

/** 행동가이드 세 칸 (Figma 순서·아이콘) */
const GUIDE_SECTIONS = [
  { key: "assetTip", title: "자산 TIP", icon: iconDollarCoin },
  { key: "riskFactor", title: "주요 위험 요인", icon: iconSiren },
  { key: "considerations", title: "대응 시 고려사항", icon: iconIdea },
] as const;

function Result({ profile }: { profile: InvestmentProfile }) {
  const view = TYPE_VIEW[profile.type];
  const me = useQuery({ queryKey: sharedKeys.me, queryFn: async () => (await getMe()).data });
  const name = me.data?.nickname ? `${me.data.nickname}님` : "나";
  // 4글자 유형별 목데이터 (results.ts). 예전 결과처럼 유형이 없으면 API 값으로 보여줘요
  const mbti = isMbtiCode(profile.mbti) ? profile.mbti : null;
  const result = mbti ? MBTI_RESULTS[mbti] : null;

  return (
    <ScreenFrame tabBar>
      <section
        className={cn(
          "rounded-card to-sub flex shrink-0 flex-col items-center bg-linear-to-b pt-6 pb-6",
          view.resultClass,
        )}
      >
        <Image src={view.character} alt="" className="size-[140px]" />
        <h1 className="text-title text-text-strong mt-2.5 font-semibold">
          {profile.typeLabel}
          {mbti && ` - ${mbti}`}
        </h1>
        <p className="text-subtitle text-text-sub mt-0.5 leading-6 font-medium">{view.tagline}</p>
        <ul className="mt-4 flex gap-2.5">
          {view.tags.map((tag) => (
            <li
              key={tag}
              className="bg-surface text-caption text-primary rounded-[16px] px-4 leading-[29px] font-semibold"
            >
              {tag}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card bg-bg mt-5 flex shrink-0 flex-col gap-3 px-[18px] py-5">
        <h2 className="text-subtitle text-text-strong font-semibold">
          {profile.typeLabel}에 대한 설명
        </h2>
        <p className="text-subtitle text-text-sub leading-6">
          {TYPE_ABOUT[profile.type]}
          <br />
          <span className="text-primary">{codesOfType(profile.type).join(", ")}</span>가{" "}
          {profile.typeLabel}에 해당해요.
        </p>
      </section>

      {mbti && result && (
        <section className="rounded-card bg-bg mt-5 flex shrink-0 flex-col gap-3 px-[18px] py-5">
          <h2 className="text-subtitle text-text-strong font-semibold">
            {name}은 <span className="text-primary font-bold">{mbti}</span>
          </h2>
          <ul className="text-subtitle text-text-sub leading-6">
            {AXIS_LEGEND.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="text-subtitle text-text-sub mt-6 leading-6">
            {name}은 {result.summary}입니다.
          </p>
        </section>
      )}

      <section className="mt-9 flex shrink-0 flex-col">
        <h2 className="text-title text-text font-bold">
          <span className="text-primary">{mbti ?? profile.typeLabel}</span>
          {mbti ? "를" : "을"} 위한 행동가이드
        </h2>
        {result ? (
          <div className="mt-6 flex flex-col gap-4">
            {GUIDE_SECTIONS.map((section) => (
              <section key={section.key} className="flex flex-col gap-[5px]">
                <h3 className="text-subtitle text-text-sub flex items-center gap-1.5 font-bold">
                  <Image src={section.icon} alt="" width={22} height={22} />
                  {section.title}
                </h3>
                <p className="text-subtitle text-text-sub p-2.5 leading-6">{result[section.key]}</p>
              </section>
            ))}
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {profile.guides.map((guide, guideIndex) => (
              <li key={guide} className="text-subtitle flex gap-2.5 leading-6">
                <span className="text-primary font-bold">{guideIndex + 1}</span>
                <span className="text-text-sub">{guide}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-caption text-text-muted mt-4 leading-5">{RESULT_DISCLAIMER}</p>
      </section>

      <div className="mt-10 flex shrink-0 flex-col gap-2.5">
        <Link href="/diagnosis/quiz" className={ctaClass()}>
          다시 진단하기
        </Link>
        <Link href="/diagnosis/home" replace className={ctaClass("secondary")}>
          진단 끝내기
        </Link>
      </div>
    </ScreenFrame>
  );
}
