"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { isApiError } from "@/shared/api";
import { sharedKeys } from "@/shared/api/query-keys";
import { cn } from "@/shared/lib/cn";
import { diagnosisKeys, getQuestionnaire, submitProfile } from "../api";
import radioOff from "../assets/radio-off.svg";
import radioOn from "../assets/radio-on.svg";
import { ctaClass } from "../labels";
import type { Questionnaire } from "../types";

/** 선택지를 고른 뒤 다음 문항으로 넘어가기까지 (고른 표시가 보이도록) */
const ADVANCE_DELAY_MS = 350;

/** 진단 문항 (PROFILE-01). 마지막 문항에서 "결과 보기"를 누르면 제출(PROFILE-02)하고 결과로 가요 */
export function DiagnosisQuizScreen() {
  const questionnaire = useQuery({
    queryKey: diagnosisKeys.questionnaire,
    queryFn: async ({ signal }) => (await getQuestionnaire(signal)).data,
  });

  if (questionnaire.isPending) {
    return (
      <ScreenFrame tabBar>
        <p className="text-caption text-text-sub py-20 text-center">불러오는 중…</p>
      </ScreenFrame>
    );
  }
  if (questionnaire.isError) {
    return (
      <ScreenFrame tabBar className="items-center gap-3 py-20">
        <p role="alert" className="text-caption text-danger">
          문항을 불러오지 못했어요.
        </p>
        <button
          type="button"
          onClick={() => void questionnaire.refetch()}
          className="rounded-button bg-sub px-5 py-2"
        >
          <span className="text-caption text-primary font-semibold">다시 시도하기</span>
        </button>
      </ScreenFrame>
    );
  }
  return <Quiz questionnaire={questionnaire.data} />;
}

function Quiz({ questionnaire }: { questionnaire: Questionnaire }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const questions = [...questionnaire.questions].sort((a, b) => a.order - b.order);
  const total = questions.length;
  const [index, setIndex] = useState(0);
  /** 문항 ID → 고른 선택지 ID */
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const question = questions[index]!;
  const isLast = index === total - 1;
  const selected = answers[question.id];

  const submit = useMutation({
    mutationFn: () =>
      submitProfile({
        questionnaireVersion: questionnaire.version,
        answers: questions.map((item) => ({ questionId: item.id, optionId: answers[item.id]! })),
      }),
    onSuccess: (res) => {
      // 최신 성향을 새 결과로 바로 바꿔요
      queryClient.setQueryData(sharedKeys.latestProfile, res.data);
      // 홈 응답에도 성향이 들어 있어서("진단 해 보세요" 띠) 홈만 다시 받게 해요.
      // 다른 기능의 키는 import 할 수 없어 queryKey 규칙([기능이름, ...])의 앞부분으로 지정해요
      void queryClient.invalidateQueries({ queryKey: ["home"] });
      router.replace("/diagnosis/result");
    },
  });

  /** 고른 뒤 다음 문항으로 넘어가기 전 타이머. 넘어가는 중에는 다른 선택지를 눌러도 무시해요 */
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelAdvance = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
  };
  useEffect(() => cancelAdvance, []);

  const choose = (optionId: string) => {
    if (advanceTimer.current) return;
    setAnswers({ ...answers, [question.id]: optionId });
    if (isLast) return;
    // 마지막 문항 전까지는 고른 선택지를 잠깐 보여준 뒤 다음 문항으로 넘어가요
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      setIndex((current) => current + 1);
    }, ADVANCE_DELAY_MS);
  };

  const goPrevious = () => {
    cancelAdvance();
    setIndex(index - 1);
    submit.reset();
  };

  return (
    <ScreenFrame
      tabBar
      // 상단 뒤로 가기: 첫 문항이 아니면 이전 문항으로
      onBack={index > 0 ? goPrevious : undefined}
    >
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        aria-label="진단 진행률"
        className="flex shrink-0 justify-between gap-1"
      >
        {questions.map((item, itemIndex) => (
          <span
            key={item.id}
            className={cn(
              "h-1.5 flex-1 rounded-[10px]",
              itemIndex <= index ? "bg-primary" : "bg-line",
            )}
          />
        ))}
      </div>
      <p className="text-subtitle text-text-muted mt-2.5 leading-[19px] font-medium">
        {index + 1} / {total}
      </p>

      <h1 className="text-title text-text-strong mt-[54px] leading-8 font-bold">{question.text}</h1>
      {question.hint && (
        <p className="text-caption text-text-sub mt-1.5 leading-[22px] font-medium">
          {question.hint}
        </p>
      )}

      <ul role="radiogroup" aria-label={question.text} className="mt-6 flex flex-col gap-4">
        {question.options.map((option) => {
          const on = selected === option.id;
          return (
            <li key={option.id}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => choose(option.id)}
                className={cn(
                  "flex h-[63px] w-full items-center gap-[13px] rounded-[16px] border-2 pl-4 text-left",
                  on ? "border-primary bg-sub" : "border-outline bg-surface",
                )}
              >
                <Image src={on ? radioOn : radioOff} alt="" />
                <span className="text-subtitle text-text leading-8 font-medium">{option.text}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="text-caption text-text-sub mt-16 text-center font-medium">
        {index === 0 ? (
          <p>선택하면 바로 다음으로 넘어가요</p>
        ) : (
          !isLast && (
            <button type="button" onClick={goPrevious}>
              &lt; 이전 질문
            </button>
          )
        )}
      </div>

      {isLast && (
        <div className="mt-auto flex shrink-0 flex-col gap-2 pt-6">
          {submit.error && (
            <p role="alert" className="text-caption text-danger text-center">
              {isApiError(submit.error) ? submit.error.message : "결과를 받지 못했어요."}
            </p>
          )}
          <button
            type="button"
            disabled={!selected || submit.isPending}
            onClick={() => submit.mutate()}
            className={ctaClass()}
          >
            {/* globals.css 의 button { font: inherit } 가 유틸리티보다 우선이라 글자 스타일은 span 에 줘요 */}
            <span className="text-[18px] leading-[26px] font-semibold">
              {submit.isPending ? "결과를 만드는 중…" : "결과 보기"}
            </span>
          </button>
        </div>
      )}
    </ScreenFrame>
  );
}
