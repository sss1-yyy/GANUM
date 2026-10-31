"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import {
  changeTone,
  formatDotDate,
  formatKRW,
  formatManWon,
  formatSignedPercent,
} from "@/shared/lib/format";
import type { SimulationDraft } from "../draft";
import { maxDrawdownPercent } from "../drawdown";
import { QUESTION_TITLE, SCENARIO_TITLES } from "../labels";
import type { Scenario, Simulation, SimulationKind } from "../types";
import { CtaButton, Disclaimer, ExampleNotice } from "./SimulationParts";

const TONE_CLASS = {
  up: "text-positive",
  down: "text-negative",
  flat: "text-text-strong",
} as const;

const ARROW = { up: "▲ ", down: "▼ ", flat: "" } as const;

/** 결과 1~3 을 한 장씩 보여줘요. 마지막 장에서 다시 돌리거나 끝낼 수 있어요 */
export function SimulationResultView({
  simulations,
  draft,
  onRetry,
  onFinish,
}: {
  simulations: Simulation[];
  draft: SimulationDraft;
  onRetry: () => void;
  onFinish: () => void;
}) {
  const [index, setIndex] = useState(0);
  const simulation = simulations[index];
  const isLast = index === simulations.length - 1;
  const kind = simulation.input.kind;
  const result = simulation.status === "SUCCEEDED" ? simulation.result : null;

  const next = () => {
    setIndex(index + 1);
    document.querySelector("main")?.scrollTo({ top: 0 });
  };

  return (
    <>
      <div className="flex h-11 items-center">
        <h1 className="text-title text-text-strong flex-1 font-semibold">시뮬레이션 결과</h1>
        <span className="text-caption text-text-sub font-medium">
          {index + 1}/{simulations.length}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <h2 className="text-subtitle flex gap-1.5 font-semibold">
          <span className="text-primary">Q.</span>
          <span className="text-text-strong flex-1 leading-[22px]">{QUESTION_TITLE[kind]}</span>
        </h2>
        <p className="text-caption text-text-sub leading-[18px]">
          {assumptionLine(simulation, draft, result?.scenarios[0])}
        </p>
      </div>
      <ExampleNotice />

      {result && result.scenarios.length >= 2 ? (
        <>
          {/* key: 다음 결과로 넘어가면 열려 있던 설명(툴팁)을 닫아요 */}
          <CompareCard
            key={simulation.id}
            kind={kind}
            focus={result.scenarios[0]}
            base={result.scenarios[1]}
            subtitles={
              // 적립식은 두 시나리오 이름이 제목과 같아서 넣은 방식을 대신 보여줘요
              kind === "RECURRING"
                ? {
                    focus: `매달 ${formatManWon(simulation.input.amount)}`,
                    base: `첫 달에 ${formatManWon(result.scenarios[1].investedAmount)}`,
                  }
                : { focus: result.scenarios[0].label, base: result.scenarios[1].label }
            }
          />
          <section className="flex flex-col gap-2.5">
            <h2 className="text-subtitle text-text-strong font-semibold">어떻게 계산했나요?</h2>
            <ul className="rounded-card bg-surface shadow-card flex flex-col gap-2.5 px-[18px] py-5">
              {result.assumptions.map((text) => (
                <li
                  key={text}
                  className="text-caption text-text-strong flex gap-2 leading-[18px] font-medium"
                >
                  <span aria-hidden className="text-primary">
                    ·
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </section>
          <div className="rounded-card bg-sub flex flex-col gap-1.5 px-[18px] py-5">
            <p className="text-caption text-primary font-semibold">한 줄 정리</p>
            <p className="text-text-strong text-[14px] leading-6 font-semibold">
              {result.explanation}
            </p>
          </div>
        </>
      ) : (
        <div role="alert" className="rounded-card bg-bg flex flex-col gap-1.5 px-[18px] py-5">
          <p className="text-subtitle text-text-strong font-semibold">
            이 결과는 계산하지 못했어요
          </p>
          <p className="text-caption text-text-sub">
            잠시 후 다시 시도해 주세요.{simulation.errorCode ? ` (${simulation.errorCode})` : ""}
          </p>
        </div>
      )}

      <div className="py-8">
        <Disclaimer />
      </div>

      <div className="flex flex-col gap-2.5">
        {isLast ? (
          <>
            <CtaButton onClick={onRetry}>한 번 더 돌리기</CtaButton>
            <CtaButton variant="secondary" onClick={onFinish}>
              시뮬레이션 끝내기
            </CtaButton>
          </>
        ) : (
          <CtaButton onClick={next}>다음 결과 보기</CtaButton>
        )}
      </div>
    </>
  );
}

/** 질문 아래 "무엇을 가정했는지" 한 줄 */
function assumptionLine(
  simulation: Simulation,
  draft: SimulationDraft,
  focus: Scenario | undefined,
): string {
  const { input } = simulation;
  const start = formatDotDate(input.startDate);
  switch (input.kind) {
    case "TIMING":
      return `${draft.TIMING.instrument?.name ?? ""} · ${start}에 ${formatKRW(input.amount)}을 투자했다고 가정했어요.`;
    case "DIVERSIFICATION":
      return `${start}부터 ${draft.DIVERSIFICATION.instruments.map((item) => item.name).join(" · ")}에 같은 돈을 나눠, 총 ${formatKRW(input.amount)}을 투자했다고 가정했어요.`;
    case "RECURRING":
      return `${draft.RECURRING.instrument?.name ?? ""} · ${start}부터 매달 ${formatKRW(input.amount)}씩${focus ? `, 총 ${formatKRW(focus.investedAmount)}을` : ""} 투자했다고 가정했어요.`;
  }
}

function CompareCard({
  kind,
  focus,
  base,
  subtitles,
}: {
  kind: SimulationKind;
  focus: Scenario;
  base: Scenario;
  subtitles: { focus: string; base: string };
}) {
  const titles = SCENARIO_TITLES[kind];
  const [showHelp, setShowHelp] = useState(false);
  const focusDrop = maxDrawdownPercent(focus.series);
  const baseDrop = maxDrawdownPercent(base.series);
  const diff = focus.profitLoss - base.profitLoss;

  return (
    <div className="rounded-card bg-surface shadow-card flex flex-col gap-3.5 px-[18px] py-5">
      <div className="flex gap-3">
        <ScenarioTile title={titles.base} subtitle={subtitles.base} scenario={base} />
        <ScenarioTile title={titles.focus} subtitle={subtitles.focus} scenario={focus} highlight />
      </div>

      <table className="text-caption w-full leading-[17px]">
        <thead>
          <tr className="font-medium">
            <th scope="col" className="sr-only">
              항목
            </th>
            <th scope="col" className="text-text-sub w-[70px] pb-2.5 text-right font-medium">
              {titles.baseShort}
            </th>
            <th scope="col" className="text-primary w-[78px] pb-2.5 text-right font-medium">
              {titles.focusShort}
            </th>
          </tr>
        </thead>
        <tbody>
          <Row label="최종 금액">
            <Cell>{formatKRW(base.finalValue)}</Cell>
            <Cell>{formatKRW(focus.finalValue)}</Cell>
          </Row>
          <Row label="수익률">
            <Cell tone={changeTone(base.returnPercent)}>
              {formatSignedPercent(base.returnPercent)}
            </Cell>
            <Cell tone={changeTone(focus.returnPercent)}>
              {formatSignedPercent(focus.returnPercent)}
            </Cell>
          </Row>
          <Row
            label={
              <span className="relative flex items-center gap-1">
                가장 크게 떨어졌을 때
                <button
                  type="button"
                  aria-label="가장 크게 떨어졌을 때 설명"
                  aria-expanded={showHelp}
                  onClick={() => setShowHelp(!showHelp)}
                  className="bg-sub flex size-3.5 items-center justify-center rounded-[7px]"
                >
                  <span className="text-primary text-[10px] leading-3 font-bold">?</span>
                </button>
                {showHelp && (
                  <span
                    role="note"
                    className="rounded-card border-line bg-surface shadow-card absolute top-6 left-0 z-10 flex w-[220px] flex-col gap-1.5 border px-3.5 py-3 leading-[18px] whitespace-normal"
                  >
                    <span className="text-text-strong font-bold">가장 크게 떨어졌을 때</span>
                    <span className="text-text-sub font-medium">
                      투자하는 동안 원금이 가장 많이 줄었던 순간의 손실률이에요. 숫자가 작을수록
                      중간에 덜 흔들렸다는 뜻이에요.
                    </span>
                  </span>
                )}
              </span>
            }
          >
            <Cell tone={changeTone(baseDrop)}>{formatSignedPercent(baseDrop)}</Cell>
            <Cell tone={changeTone(focusDrop)}>{formatSignedPercent(focusDrop)}</Cell>
          </Row>
        </tbody>
      </table>

      <p className="text-text-strong text-[14px] leading-5 font-semibold">
        {diff === 0
          ? "두 경우의 수익이 같았어요."
          : `${diff > 0 ? titles.focusShort : titles.baseShort} 쪽 수익이 ${formatKRW(Math.abs(diff))} 더 컸어요.`}
        {focusDrop < 0 && (
          <>
            <br />
            {titles.focusShort} 쪽은 중간에 {formatSignedPercent(focusDrop)}까지 내려갔어요.
          </>
        )}
      </p>
    </div>
  );
}

function ScenarioTile({
  title,
  subtitle,
  scenario,
  highlight = false,
}: {
  title: string;
  subtitle: string;
  scenario: Scenario;
  highlight?: boolean;
}) {
  const tone = changeTone(scenario.returnPercent);
  return (
    <div
      className={cn(
        "rounded-card flex min-w-0 flex-1 flex-col gap-1.5 px-[18px] py-5",
        highlight ? "bg-sub" : "bg-bg",
      )}
    >
      <p
        className={cn(
          "text-caption font-semibold",
          highlight ? "text-primary" : "text-text-strong",
        )}
      >
        {title}
      </p>
      <p className="text-caption text-text-sub truncate font-medium">{subtitle}</p>
      <p className="text-text-strong text-[18px] leading-[26px] font-bold whitespace-nowrap">
        {formatKRW(scenario.finalValue)}
      </p>
      <p className={cn("text-caption font-semibold", TONE_CLASS[tone])}>
        {ARROW[tone]}
        {formatSignedPercent(scenario.returnPercent)}
      </p>
    </div>
  );
}

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <tr>
      <th scope="row" className="text-text-sub py-1.5 text-left font-medium whitespace-nowrap">
        {label}
      </th>
      {children}
    </tr>
  );
}

function Cell({ tone, children }: { tone?: keyof typeof TONE_CLASS; children: ReactNode }) {
  return (
    <td
      className={cn(
        "py-1.5 text-right font-semibold whitespace-nowrap",
        TONE_CLASS[tone ?? "flat"],
      )}
    >
      {children}
    </td>
  );
}
