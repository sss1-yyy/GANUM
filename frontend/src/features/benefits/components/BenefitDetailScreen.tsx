"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { USE_MOCK, isApiError } from "@/shared/api";
import { cn } from "@/shared/lib/cn";
import type { EligibilityStatus } from "@/shared/types";
import { benefitKeys, getBenefit } from "../api";
import type { BenefitDetail } from "../types";

const TABS = ["내 자격", "상세 정보", "신청 방법"] as const;

const eligibilityLabels: Record<EligibilityStatus, string> = {
  LIKELY_ELIGIBLE: "대상일 가능성이 있어요.",
  LIKELY_INELIGIBLE: "일부 요건을 충족하지 않을 수 있어요.",
  NEEDS_INFO: "자격을 확인하려면 정보가 더 필요해요.",
  UNKNOWN: "신청 자격을 확인해 주세요.",
};

const actionClass =
  "bg-primary text-surface rounded-button block w-full px-4 py-4 text-center font-semibold";

function applicationHref(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-surface shadow-card rounded-card space-y-3 p-4">
      <h2 className="text-text-strong font-bold">{title}</h2>
      {children}
    </section>
  );
}

function DetailContent({ tab, detail }: { tab: (typeof TABS)[number]; detail: BenefitDetail }) {
  switch (tab) {
    case "내 자격":
      return (
        <Section title="나는 받을 수 있을까요?">
          <p className="text-primary font-semibold">
            {eligibilityLabels[detail.eligibility.status]}
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            {detail.eligibility.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
            {detail.eligibility.missingFields.map((field, index) => (
              <li key={`missing-${index}`}>{field} 정보를 확인해 주세요.</li>
            ))}
          </ul>
        </Section>
      );

    case "상세 정보":
      return (
        <>
          <Section title="상품 정보">
            {/* [명세 외] 디자인의 상품 정보 표에 대응하는 개별 API 필드가 없어요. */}
            <p className="text-sm leading-relaxed">{detail.supportDescription}</p>
          </Section>
          {detail.requirements.length > 0 && (
            <Section title="지원 대상">
              <ul className="list-disc space-y-2 pl-5 text-sm">
                {detail.requirements.map((requirement, index) => (
                  <li key={index}>{requirement}</li>
                ))}
              </ul>
            </Section>
          )}
          {detail.cautions.length > 0 && (
            <Section title="유의 사항">
              <ul className="list-disc space-y-2 pl-5 text-sm">
                {detail.cautions.map((caution, index) => (
                  <li key={index}>{caution}</li>
                ))}
              </ul>
            </Section>
          )}
        </>
      );

    case "신청 방법":
      return (
        <>
          <Section title="신청 방법">
            {detail.applicationSteps.length > 0 ? (
              <ol className="list-decimal space-y-3 pl-5 text-sm">
                {detail.applicationSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="text-text-sub text-sm">등록된 신청 방법이 없어요.</p>
            )}
          </Section>
          {detail.requiredDocuments.length > 0 && (
            <Section title="미리 준비하면 편해요">
              <ul className="list-disc space-y-2 pl-5 text-sm">
                {detail.requiredDocuments.map((document, index) => (
                  <li key={index}>{document}</li>
                ))}
              </ul>
            </Section>
          )}
        </>
      );
  }
}

export function BenefitDetailScreen({ benefitId }: { benefitId: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("내 자격");
  const sheet = useRef<HTMLDialogElement>(null);
  const query = useQuery({
    queryKey: benefitKeys.detail(benefitId),
    queryFn: () => getBenefit(benefitId),
  });

  if (query.isPending) {
    return (
      <ScreenFrame>
        <p role="status">혜택을 불러오고 있어요.</p>
      </ScreenFrame>
    );
  }

  if (!query.data) {
    const missing = isApiError(query.error) && query.error.status === 404;
    return (
      <ScreenFrame className="gap-3">
        <p role="alert" className="text-danger">
          {missing ? "혜택을 찾을 수 없어요." : "혜택을 불러오지 못했어요."}
        </p>
        {missing ? (
          <Link href="/benefits" className="text-primary">
            혜택 목록으로
          </Link>
        ) : (
          <button
            type="button"
            className="text-primary self-start"
            onClick={() => void query.refetch()}
          >
            다시 시도
          </button>
        )}
      </ScreenFrame>
    );
  }

  const detail = query.data.data;
  const isSavings = detail.benefit.category === "SAVING";
  const directUrl = applicationHref(detail.applicationUrl);

  return (
    <ScreenFrame className="gap-4">
      <h1 className="text-title text-text-strong font-bold">{detail.benefit.title}</h1>
      <div className="bg-sub rounded-card p-4">
        <p className="text-caption text-text-sub">지원 내용</p>
        <p className="text-subtitle text-text-strong mt-1 font-bold">
          {USE_MOCK ? "[예시] " : ""}
          {detail.benefit.summary}
        </p>
      </div>

      <div
        role="group"
        aria-label="혜택 상세 메뉴"
        className="bg-bg grid grid-cols-3 gap-1 rounded-full p-1"
      >
        {TABS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={tab === option}
            onClick={() => setTab(option)}
            className={cn(
              "rounded-full px-1 py-2",
              tab === option ? "bg-primary text-surface" : "text-text-sub",
            )}
          >
            <span className="text-caption font-semibold">{option}</span>
          </button>
        ))}
      </div>

      <DetailContent tab={tab} detail={detail} />

      <div className="bg-surface sticky bottom-0 mt-auto pt-3">
        {detail.institutions.length > 0 ? (
          <button type="button" className={actionClass} onClick={() => sheet.current?.showModal()}>
            {isSavings ? "은행 앱으로 이동" : "신청 기관 보기"}
          </button>
        ) : directUrl ? (
          <a href={directUrl} className={actionClass}>
            신청 페이지로 이동
          </a>
        ) : (
          <p className="text-text-sub py-2 text-center text-sm">등록된 신청 링크가 없어요.</p>
        )}
      </div>

      <dialog
        ref={sheet}
        aria-labelledby="benefit-sheet-title"
        className="bg-surface text-text backdrop:bg-text-strong/40 fixed inset-x-0 top-auto bottom-0 mx-auto my-0 max-h-[85dvh] w-full max-w-(--app-width) overflow-y-auto rounded-t-[24px] p-6"
      >
        <div className="bg-line mx-auto mb-4 h-1 w-10 rounded-full" />
        <div className="flex items-center justify-between gap-3">
          <h2 id="benefit-sheet-title" className="text-subtitle text-text-strong font-bold">
            {isSavings ? "은행을 선택해 주세요" : "신청 기관을 확인해 주세요"}
          </h2>
          <form method="dialog">
            <button type="submit" className="text-text-sub px-2 py-1">
              닫기
            </button>
          </form>
        </div>

        <ul className="mt-4 grid grid-cols-3 gap-3">
          {detail.institutions.map((institution) => {
            const url = applicationHref(institution.applicationUrl);
            return (
              <li
                key={institution.id}
                className="bg-surface shadow-card rounded-card min-w-0 text-center"
              >
                {url ? (
                  <a href={url} className="text-primary block px-2 py-4 text-sm font-semibold">
                    {institution.name}
                  </a>
                ) : (
                  <div className="px-2 py-4">
                    <p className="text-text-strong text-sm font-semibold">{institution.name}</p>
                    <p className="text-caption text-text-sub mt-1">링크 미제공</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </dialog>
    </ScreenFrame>
  );
}
