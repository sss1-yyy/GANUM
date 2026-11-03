"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { getLatestInvestmentProfile } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { cn } from "@/shared/lib/cn";
import type { InvestmentProfile } from "@/shared/types";
import { TYPE_VIEW, ctaClass } from "../labels";

/** 진단 결과 (PROFILE-03 최근 결과). 진단 직후에는 제출 응답을 그대로 보여줘요 */
export function DiagnosisResultScreen() {
  const profile = useQuery({
    queryKey: sharedKeys.latestProfile,
    queryFn: async () => (await getLatestInvestmentProfile()).data,
  });

  if (profile.isPending) {
    return (
      <ScreenFrame>
        <p className="text-caption text-text-sub py-20 text-center">불러오는 중…</p>
      </ScreenFrame>
    );
  }
  if (profile.isError) {
    return (
      <ScreenFrame className="items-center gap-3 py-20">
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
      <ScreenFrame className="items-center gap-4 py-20">
        <p className="text-subtitle text-text-sub">아직 진단한 결과가 없어요.</p>
        <Link href="/diagnosis" className={ctaClass()}>
          진단하러 가기
        </Link>
      </ScreenFrame>
    );
  }
  return <Result profile={profile.data} />;
}

function Result({ profile }: { profile: InvestmentProfile }) {
  const view = TYPE_VIEW[profile.type];
  return (
    <ScreenFrame>
      <section
        className={cn(
          "rounded-card to-sub flex shrink-0 flex-col items-center bg-linear-to-b pt-6 pb-6",
          view.resultClass,
        )}
      >
        <Image src={view.character} alt="" className="size-[140px]" />
        <h1 className="text-title text-text-strong mt-2.5 font-semibold">{profile.typeLabel}</h1>
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
        <p className="text-subtitle text-text-sub leading-6">{profile.description}</p>
      </section>

      {profile.guides.length > 0 && (
        <section className="mt-[30px] flex shrink-0 flex-col gap-4">
          <h2 className="text-text text-[22px] font-bold">
            <span className="text-primary">{profile.typeLabel}</span>을 위한 행동가이드
          </h2>
          <ul className="flex flex-col gap-3">
            {profile.guides.map((guide, guideIndex) => (
              <li key={guide} className="text-subtitle flex gap-2.5 leading-6">
                <span className="text-primary font-bold">{guideIndex + 1}</span>
                <span className="text-text-sub">{guide}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 flex shrink-0 flex-col gap-2.5">
        <Link href="/diagnosis/quiz" className={ctaClass()}>
          다시 진단하기
        </Link>
        <Link href="/home" replace className={ctaClass("secondary")}>
          진단 끝내기
        </Link>
      </div>
    </ScreenFrame>
  );
}
