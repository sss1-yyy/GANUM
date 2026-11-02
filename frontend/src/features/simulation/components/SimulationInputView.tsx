"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { formatDotDate, formatKRW, formatManWon } from "@/shared/lib/format";
import chevronDown from "../assets/chevron-down.svg";
import chevronUp from "../assets/chevron-up.svg";
import dot from "../assets/dot.svg";
import {
  draftSummary,
  instrumentsLabel,
  isComplete,
  latestStartDate,
  type SimulationDraft,
} from "../draft";
import { DIVERSIFICATION_MAX, FIXED_AMOUNT, KIND_ORDER, QUESTION_TITLE } from "../labels";
import type { SimulationKind } from "../types";
import { AmountSheet } from "./AmountSheet";
import { DateSheet } from "./DateSheet";
import { InstrumentSheet } from "./InstrumentSheet";
import { CtaButton, Disclaimer, ExampleNotice } from "./SimulationParts";

type SheetId =
  | "TIMING_INSTRUMENT"
  | "TIMING_DATE"
  | "DIVERSIFICATION_DATE"
  | "DIVERSIFICATION_INSTRUMENTS"
  | "RECURRING_AMOUNT"
  | "RECURRING_DATE"
  | "RECURRING_INSTRUMENT";

const HINT: Record<SimulationKind, string> = {
  TIMING: `${formatManWon(FIXED_AMOUNT.TIMING)} 기준 · 종목과 투자 시점을 골라 주세요.`,
  DIVERSIFICATION: `${formatManWon(FIXED_AMOUNT.DIVERSIFICATION)} 기준 · 시작일과 종목 2~3개를 골라 주세요.`,
  RECURRING: "금액, 시작일, 대상을 모두 입력해 주세요.",
};

export function SimulationInputView({
  draft,
  onChange,
  endDate,
  remaining,
  isFreePlan,
  running,
  error,
  onRun,
}: {
  draft: SimulationDraft;
  onChange: (draft: SimulationDraft) => void;
  /** 가장 최근 거래일 (계산 종료일) */
  endDate: string;
  remaining: number | null;
  isFreePlan: boolean;
  running: boolean;
  error: string | null;
  onRun: () => void;
}) {
  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [open, setOpen] = useState<Record<SimulationKind, boolean>>({
    TIMING: true,
    DIVERSIFICATION: true,
    RECURRING: true,
  });
  const close = () => setSheet(null);
  const update = <K extends SimulationKind>(kind: K, patch: Partial<SimulationDraft[K]>) => {
    onChange({ ...draft, [kind]: { ...draft[kind], ...patch } });
    close();
  };

  const doneCount = KIND_ORDER.filter((kind) => isComplete(draft, kind)).length;
  const allDone = doneCount === KIND_ORDER.length;
  const outOfRuns = remaining === 0;

  return (
    <>
      <div className="flex flex-col gap-1.5 pt-2">
        <div className="flex items-center gap-2">
          <p className="text-caption text-primary flex-1 font-semibold">시뮬레이션</p>
          {remaining !== null && (
            <span className="bg-sub flex items-center gap-1 rounded-xl px-3.5 py-1">
              <Image src={dot} alt="" width={6} height={6} />
              <span className="text-primary text-[10.5px] font-semibold">
                {isFreePlan ? "무료 " : ""}
                {remaining}회 남음
              </span>
            </span>
          )}
        </div>
        <h1 className="text-title text-text-strong font-semibold">다른 선택을 해봤다면?</h1>
        <p className="text-caption text-text-sub leading-[18px] font-medium">
          같은 돈을 다르게 투자했다면 결과가 어떻게 달랐을지 비교해 봐요.
        </p>
      </div>
      <ExampleNotice />

      {KIND_ORDER.map((kind) => (
        <QuestionCard
          key={kind}
          title={QUESTION_TITLE[kind]}
          complete={isComplete(draft, kind)}
          open={open[kind]}
          onToggle={() => setOpen({ ...open, [kind]: !open[kind] })}
          summary={isComplete(draft, kind) ? draftSummary(draft, kind) : null}
          hint={HINT[kind]}
        >
          {kind === "TIMING" && (
            <FieldRow>
              <SelectField
                label="종목·ETF"
                value={draft.TIMING.instrument?.name}
                placeholder="종목 선택"
                onClick={() => setSheet("TIMING_INSTRUMENT")}
              />
              <SelectField
                label="투자 시점"
                value={draft.TIMING.startDate && formatDotDate(draft.TIMING.startDate)}
                placeholder="날짜 선택"
                onClick={() => setSheet("TIMING_DATE")}
              />
            </FieldRow>
          )}
          {kind === "DIVERSIFICATION" && (
            <FieldRow>
              <SelectField
                label="시작 시점"
                value={
                  draft.DIVERSIFICATION.startDate && formatDotDate(draft.DIVERSIFICATION.startDate)
                }
                placeholder="날짜 선택"
                onClick={() => setSheet("DIVERSIFICATION_DATE")}
              />
              <SelectField
                label={`종목 (2~${DIVERSIFICATION_MAX}개)`}
                value={instrumentsLabel(draft.DIVERSIFICATION.instruments)}
                placeholder="종목 선택"
                onClick={() => setSheet("DIVERSIFICATION_INSTRUMENTS")}
              />
            </FieldRow>
          )}
          {kind === "RECURRING" && (
            <>
              <FieldRow>
                <SelectField
                  label="월 금액"
                  value={draft.RECURRING.amount ? formatKRW(draft.RECURRING.amount) : null}
                  placeholder="금액 입력"
                  chevron={false}
                  onClick={() => setSheet("RECURRING_AMOUNT")}
                />
                <SelectField
                  label="시작일"
                  value={draft.RECURRING.startDate && formatDotDate(draft.RECURRING.startDate)}
                  placeholder="날짜 선택"
                  onClick={() => setSheet("RECURRING_DATE")}
                />
              </FieldRow>
              <FieldRow>
                <SelectField
                  label="대상"
                  value={draft.RECURRING.instrument?.name}
                  placeholder="대상 선택"
                  onClick={() => setSheet("RECURRING_INSTRUMENT")}
                />
                <SelectField label="투자 주기" value={null} placeholder="매달 (고정)" />
              </FieldRow>
            </>
          )}
        </QuestionCard>
      ))}

      <div className="text-caption text-text-sub flex flex-col gap-6 py-8 text-center">
        <p className="leading-[17px] font-medium">
          {allDone
            ? `3/3 완료 · 실행하면 ${isFreePlan ? "무료 " : ""}횟수가 1회 사용돼요`
            : `세 질문의 조건을 모두 골라 주세요 (${doneCount}/3 완료)`}
        </p>
        <Disclaimer />
      </div>

      <div className="flex flex-col gap-2">
        {error && (
          <p role="alert" className="text-caption text-danger text-center">
            {error}
          </p>
        )}
        <CtaButton disabled={!allDone || outOfRuns || running} onClick={onRun}>
          {running
            ? "시뮬레이션을 돌리는 중…"
            : outOfRuns
              ? "이용권을 모두 썼어요"
              : "시뮬레이션 돌리기"}
        </CtaButton>
      </div>

      {sheet === "TIMING_INSTRUMENT" && (
        <InstrumentSheet
          title="종목·ETF를 골라 주세요"
          description="그때 샀다면 지금 얼마가 됐을지 계산해 볼게요"
          listLabel="많이 찾는 종목"
          initial={draft.TIMING.instrument ? [draft.TIMING.instrument] : []}
          onConfirm={([instrument]) => update("TIMING", { instrument })}
          onClose={close}
        />
      )}
      {sheet === "TIMING_DATE" && (
        <DateSheet
          title="투자 시점을 골라 주세요"
          description="이날 샀다고 가정하고 계산해요"
          initial={draft.TIMING.startDate}
          base={endDate}
          max={latestStartDate("TIMING", endDate)}
          onConfirm={(startDate) => update("TIMING", { startDate })}
          onClose={close}
        />
      )}
      {sheet === "DIVERSIFICATION_DATE" && (
        <DateSheet
          title="시작 시점을 골라 주세요"
          description="이날부터 나눠서 샀다고 계산해요"
          initial={draft.DIVERSIFICATION.startDate}
          base={endDate}
          max={latestStartDate("DIVERSIFICATION", endDate)}
          onConfirm={(startDate) => update("DIVERSIFICATION", { startDate })}
          onClose={close}
        />
      )}
      {sheet === "DIVERSIFICATION_INSTRUMENTS" && (
        <InstrumentSheet
          title={`종목을 2~${DIVERSIFICATION_MAX}개 골라 주세요`}
          description="고른 종목에 같은 금액을 나눠 샀다고 계산해요"
          listLabel="많이 찾는 종목"
          initial={draft.DIVERSIFICATION.instruments}
          min={2}
          max={DIVERSIFICATION_MAX}
          showTypeChips={false}
          onConfirm={(instruments) => update("DIVERSIFICATION", { instruments })}
          onClose={close}
        />
      )}
      {sheet === "RECURRING_AMOUNT" && (
        <AmountSheet
          initial={draft.RECURRING.amount}
          onConfirm={(amount) => update("RECURRING", { amount })}
          onClose={close}
        />
      )}
      {sheet === "RECURRING_DATE" && (
        <DateSheet
          title="시작일을 골라 주세요"
          description="이날부터 매달 투자했다고 계산해요"
          initial={draft.RECURRING.startDate}
          base={endDate}
          max={latestStartDate("RECURRING", endDate)}
          onConfirm={(startDate) => update("RECURRING", { startDate })}
          onClose={close}
        />
      )}
      {sheet === "RECURRING_INSTRUMENT" && (
        <InstrumentSheet
          title="어디에 투자할까요?"
          description="매달 같은 금액으로 사요. 적립식엔 ETF가 많이 쓰여요"
          listLabel="적립식으로 많이 고르는 종목"
          initial={draft.RECURRING.instrument ? [draft.RECURRING.instrument] : []}
          initialType="ETF"
          onConfirm={([instrument]) => update("RECURRING", { instrument })}
          onClose={close}
        />
      )}
    </>
  );
}

function QuestionCard({
  title,
  complete,
  open,
  onToggle,
  summary,
  hint,
  children,
}: {
  title: string;
  complete: boolean;
  open: boolean;
  onToggle: () => void;
  summary: string | null;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-card bg-surface shadow-card flex flex-col gap-3.5 px-[18px] py-5">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="text-subtitle text-primary font-bold">Q.</span>
        <span className="text-subtitle text-text-strong flex-1 leading-[22px] font-semibold">
          {title}
        </span>
        {complete && (
          <span className="bg-sub text-primary rounded-xl px-3.5 py-1 text-[10.5px] font-semibold">
            완료
          </span>
        )}
        <Image
          src={chevronUp}
          alt=""
          width={18}
          height={18}
          className={cn("transition-transform", !open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col gap-3">
            <p className="text-caption text-text-strong font-semibold">비교할 조건</p>
            {children}
          </div>
          <p className="text-caption text-text-sub leading-[17px] font-medium">
            {complete ? "조건을 모두 골랐어요." : hint}
          </p>
        </div>
      ) : (
        summary && <p className="text-caption text-text-sub font-medium">{summary}</p>
      )}
    </section>
  );
}

function FieldRow({ children }: { children: ReactNode }) {
  return <div className="flex gap-3">{children}</div>;
}

/** 눌러서 시트를 여는 칸. onClick 이 없으면 바꿀 수 없는 고정 값(회색)이에요 */
function SelectField({
  label,
  value,
  placeholder,
  chevron = true,
  onClick,
}: {
  label: string;
  value: string | null | undefined;
  placeholder: string;
  chevron?: boolean;
  onClick?: () => void;
}) {
  const filled = Boolean(value);
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <p className="text-caption text-text-sub font-medium">{label}</p>
      <button
        type="button"
        disabled={!onClick}
        onClick={onClick}
        className={cn(
          "flex h-11 w-full items-center gap-2 rounded-[16px] border px-3.5 text-left",
          filled ? "bg-surface border-primary" : "border-transparent",
          !filled && (onClick ? "bg-bg" : "bg-line"),
        )}
      >
        <span
          className={cn(
            "text-caption min-w-0 flex-1 truncate",
            filled ? "text-text-strong font-semibold" : "text-text-muted font-medium",
          )}
        >
          {value || placeholder}
        </span>
        {chevron && onClick && <Image src={chevronDown} alt="" width={14} height={14} />}
      </button>
    </div>
  );
}
