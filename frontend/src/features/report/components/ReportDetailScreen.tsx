"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { isApiError, POLL_INTERVAL_MS, USE_MOCK } from "@/shared/api";
import { cn } from "@/shared/lib/cn";
import {
  changeTone,
  formatKRW,
  formatManWon,
  formatMonthDay,
  formatSignedKRW,
  formatSignedPercent,
} from "@/shared/lib/format";
import { getReport, reportKeys } from "../api";
import check from "../assets/check.svg";
import chevronRightSmall from "../assets/chevron-right-small.svg";
import dotActive from "../assets/dot-active.svg";
import dot from "../assets/dot.svg";
import { categoryLabel } from "../labels";
import type {
  FinancialSummary,
  PaperSummary,
  Report,
  ReportAdvice,
  ReportAllocation,
  ReportSource,
} from "../types";
import { ReportScreenFrame } from "./ReportScreenFrame";

export function ReportDetailScreen({ reportId }: { reportId: string }) {
  const query = useQuery({
    queryKey: reportKeys.detail(reportId),
    queryFn: async ({ signal }) => (await getReport(reportId, signal)).data,
    // 202 → 상세 GET 반복 조회 → SUCCEEDED/FAILED 에서 중단
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "SUCCEEDED" || status === "FAILED" ? false : POLL_INTERVAL_MS;
    },
  });
  const report = query.data;

  return (
    <ReportScreenFrame className="gap-2.5">
      <h1 className="text-title text-text-strong font-semibold">내 레포트</h1>
      {query.isError ? (
        <StatusMessage
          title="레포트를 불러오지 못했어요"
          description={isApiError(query.error) ? query.error.message : undefined}
        />
      ) : !report || report.status === "QUEUED" || report.status === "RUNNING" ? (
        <StatusMessage
          title="레포트를 만들고 있어요"
          description="입력한 정보를 정리하는 중이에요. 잠시만 기다려 주세요."
          busy
        />
      ) : report.status === "FAILED" ? (
        <StatusMessage
          title="레포트를 만들지 못했어요"
          description={`잠시 후 다시 시도해 주세요.${report.errorCode ? ` (${report.errorCode})` : ""}`}
        />
      ) : (
        <ReportBody report={report} />
      )}
    </ReportScreenFrame>
  );
}

function StatusMessage({
  title,
  description,
  busy = false,
}: {
  title: string;
  description?: string;
  busy?: boolean;
}) {
  return (
    <div
      role={busy ? "status" : "alert"}
      className="flex flex-col items-center gap-2 py-24 text-center"
    >
      <p className="text-subtitle text-text-strong font-semibold">{title}</p>
      {description && <p className="text-caption text-text-sub leading-[18px]">{description}</p>}
      {!busy && (
        <Link href="/report" className="text-caption text-primary mt-4 font-semibold">
          레포트 목록으로
        </Link>
      )}
    </div>
  );
}

function ReportBody({ report }: { report: Report }) {
  const isPaper = report.kind === "PAPER";
  return (
    <>
      <div className="flex flex-col gap-4">
        <p className="text-caption text-text-sub font-medium">
          {formatMonthDay(report.createdAt)} 생성 ·{" "}
          {isPaper ? "모의투자 기준" : "내 재정 정보 기준"}
        </p>
        <h2 className="text-subtitle text-text-strong font-semibold">
          {isPaper ? "내 모의투자 한눈에" : "내 금융 상태 한눈에"}
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {report.summary && (
          <Card className="gap-3">
            {USE_MOCK && <p className="text-caption text-text-sub font-medium">[예시]</p>}
            {"totalValue" in report.summary ? (
              <PaperFigures summary={report.summary} />
            ) : (
              <FinancialFigures summary={report.summary} />
            )}
          </Card>
        )}

        {report.advice.length > 0 && <AdviceTimeline advice={report.advice} />}
        {report.allocation.length > 0 && <AllocationSection allocation={report.allocation} />}
        {report.risks.length > 0 && <BulletSection title="살펴볼 점" items={report.risks} />}
        {report.priceChangeReasons.length > 0 && (
          <BulletSection title="가격이 움직인 이유" items={report.priceChangeReasons} />
        )}
        <SourcesSection sources={report.sources} isPaper={isPaper} />
      </div>

      <div className="flex flex-col gap-6">
        <div className="text-caption text-text-sub flex flex-col gap-1 pt-[38px] pb-6 text-center leading-[18px] font-light">
          {report.limitations.map((text) => (
            <p key={text}>{text}</p>
          ))}
          {isPaper && <p>과거 결과이며 앞으로를 보장하지 않아요.</p>}
          <p>
            레포트는 입력하신 정보를 바탕으로 한 참고용 안내예요. 특정 상품 가입을 권유하지 않아요.
          </p>
        </div>
        {/* TODO(B 챗봇 시트): contextType "REPORT", contextId = report.id 로 챗봇 시트 열기 연결 */}
        <button type="button" className="rounded-button bg-primary h-[60px] w-full">
          {/* globals.css 의 button { font: inherit } 가 유틸리티보다 우선이라 글자 스타일은 span 에 줘요 */}
          <span className="text-subtitle text-surface font-semibold">AI에게 더 물어보기</span>
        </button>
      </div>
    </>
  );
}

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn("rounded-card bg-surface shadow-card flex flex-col px-[18px] py-5", className)}
    >
      {children}
    </div>
  );
}

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-subtitle text-text-strong font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Tile({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-card bg-bg flex min-w-0 flex-1 flex-col gap-1.5 px-4 py-3 whitespace-nowrap">
      <p className="text-caption text-text-sub font-medium">{label}</p>
      <p className={cn("text-subtitle text-text-strong font-semibold", valueClassName)}>{value}</p>
    </div>
  );
}

/** 금액이 없을 수 있는 값(월 수입·지출)은 "-" 로 보여줘요 */
const manWonOrDash = (value: number | null) => (value === null ? "-" : formatManWon(value));

function FinancialFigures({ summary }: { summary: FinancialSummary }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <Tile label="자산" value={formatManWon(summary.totalAssets)} />
        <Tile label="부채" value={formatManWon(summary.totalDebt)} />
      </div>
      <div className="flex gap-1.5">
        <Tile label="월 수입" value={manWonOrDash(summary.monthlyIncome)} />
        <Tile label="월 지출" value={manWonOrDash(summary.monthlyExpense)} />
      </div>
      {summary.monthlySurplus !== null && (
        <div
          className={cn(
            "rounded-card bg-sub flex items-center gap-2 px-[18px] py-4 font-semibold",
            summary.monthlySurplus < 0 ? "text-danger" : "text-primary",
          )}
        >
          {/* 지출이 수입보다 크면 음수. formatManWon 은 부호를 떼므로 라벨로 구분해요 */}
          <p className="text-caption flex-1">
            {summary.monthlySurplus < 0 ? "월 부족액" : "월 저축 여력"}
          </p>
          <p className="text-subtitle whitespace-nowrap">
            약 {formatManWon(summary.monthlySurplus)}
          </p>
        </div>
      )}
    </div>
  );
}

const TONE_CLASS = {
  up: "text-positive",
  down: "text-negative",
  flat: "text-text-strong",
} as const;

function PaperFigures({ summary }: { summary: PaperSummary }) {
  const tone = TONE_CLASS[changeTone(summary.profitLoss)];
  return (
    <div className="flex flex-col gap-1.5">
      <span className="bg-sub text-caption text-primary self-start rounded-xl px-3.5 py-1 font-semibold">
        가상 자금 · 실제 돈이 아니에요
      </span>
      <Tile label="평가 금액" value={formatKRW(summary.totalValue)} />
      <div className="flex gap-1.5">
        <Tile label="평가 손익" value={formatSignedKRW(summary.profitLoss)} valueClassName={tone} />
        <Tile
          label="수익률"
          value={formatSignedPercent(summary.returnPercent)}
          valueClassName={TONE_CLASS[changeTone(summary.returnPercent)]}
        />
      </div>
    </div>
  );
}

/** Figma "조언 변형 E · 긴급도 타임라인". 긴급도 태그는 API 에 없어서 순서만 보여줘요. */
function AdviceTimeline({ advice }: { advice: ReportAdvice[] }) {
  return (
    <Section title="지금 가장 중요한 조언">
      <ol className="flex flex-col gap-4">
        {advice.map((item, index) => {
          const last = index === advice.length - 1;
          return (
            <li key={item.title} className="flex gap-3">
              <div className="flex w-3 shrink-0 flex-col items-center self-stretch">
                <Image src={index === 0 ? dotActive : dot} alt="" width={12} height={12} />
                {/* 다음 단계까지 이어지도록 카드 사이 간격(16px)만큼 더 내려요 */}
                {!last && <div className="bg-outline -mb-4 w-0.5 flex-1" />}
              </div>
              <Card className="min-w-0 flex-1 gap-1.5">
                <p className="text-subtitle text-text-strong leading-[22px] font-semibold">
                  {item.title}
                </p>
                <p className="text-caption text-text-sub leading-[18px] font-medium">
                  {item.description}
                </p>
                {item.considerations.map((text) => (
                  <p key={text} className="text-caption text-text-muted leading-[18px] font-medium">
                    · {text}
                  </p>
                ))}
              </Card>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

/** Figma "분야별 맞춤 조언"의 칩 + 카드 모양에 allocation(자산 배분 예시)을 담아요. */
function AllocationSection({ allocation }: { allocation: ReportAllocation[] }) {
  const [selected, setSelected] = useState(0);
  const current = allocation[selected] ?? allocation[0];
  return (
    <Section title="[예시] 이렇게 나눠 볼 수 있어요">
      <div role="tablist" className="no-scrollbar -mx-8 flex gap-2 overflow-x-auto px-8 py-2">
        {allocation.map((item, index) => (
          <button
            key={item.category}
            type="button"
            role="tab"
            aria-selected={index === selected}
            onClick={() => setSelected(index)}
            className={cn(
              "rounded-pill shrink-0 px-4 py-2 whitespace-nowrap",
              index === selected
                ? "bg-primary text-surface"
                : "bg-surface text-text-sub shadow-card",
            )}
          >
            <span className="text-caption block font-medium">{categoryLabel(item.category)}</span>
          </button>
        ))}
      </div>
      <Card className="gap-1.5">
        <span className="bg-sub text-caption text-primary self-start rounded-xl px-3.5 py-1 font-semibold">
          {categoryLabel(current.category)}
        </span>
        <p className="text-subtitle text-text-strong leading-6 font-semibold">
          자산의 {current.weightPercent}%
        </p>
        <p className="text-caption text-text leading-[18px] font-medium">{current.reason}</p>
        <div className="bg-bg mt-2.5 flex h-2 overflow-hidden rounded-full" aria-hidden>
          {allocation.map((item, index) => (
            <div
              key={item.category}
              style={{ width: `${item.weightPercent}%` }}
              className={index === selected ? "bg-primary" : "bg-sub"}
            />
          ))}
        </div>
      </Card>
    </Section>
  );
}

function BulletSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Section title={title}>
      <Card className="gap-2.5">
        {items.map((text) => (
          <p key={text} className="text-caption text-text flex gap-2 leading-[18px] font-medium">
            <span aria-hidden className="bg-primary mt-[7px] size-1 shrink-0 rounded-full" />
            {text}
          </p>
        ))}
      </Card>
    </Section>
  );
}

function SourcesSection({ sources, isPaper }: { sources: ReportSource[]; isPaper: boolean }) {
  return (
    <Section title="왜 이 조언인가요?">
      <Card className="gap-3.5">
        <p className="text-caption text-text-sub font-medium">이 조언에 쓰인 정보예요.</p>
        {sources.length > 0 && (
          <ul className="flex flex-col gap-2.5">
            {sources.map((source) => (
              <li key={source.title} className="text-caption flex items-center gap-2">
                <Image src={check} alt="" width={16} height={16} />
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-text-sub min-w-0 flex-1 font-medium underline"
                  >
                    {source.title}
                  </a>
                ) : (
                  <p className="text-text-sub min-w-0 flex-1 font-medium">{source.title}</p>
                )}
                {source.asOf && (
                  <p className="text-text-strong font-semibold whitespace-nowrap">
                    {formatMonthDay(source.asOf)} 기준
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <Link
          href={isPaper ? "/portfolio" : "/mypage/finance"}
          className="text-caption text-primary flex items-center gap-1 self-start font-semibold"
        >
          {isPaper ? "내 포트폴리오 보기" : "내 정보 수정하기"}
          <Image src={chevronRightSmall} alt="" width={14} height={14} />
        </Link>
      </Card>
    </Section>
  );
}
