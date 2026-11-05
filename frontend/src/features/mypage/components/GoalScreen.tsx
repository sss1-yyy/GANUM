"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { USE_MOCK } from "@/shared/api";
import { getGoal, putGoal } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { formatDotDate, formatKRW, formatPercent } from "@/shared/lib/format";
import type { Goal } from "@/shared/types";
import { fieldClass, FormActions, FormField, formNumber, formText, maxAmount } from "./MypageForm";
import { buttonClass, cardClass, InfoRow, LoadError, Loading, MypageScreen } from "./MypageScreen";

function GoalForm({
  goal,
  onClose,
  onSaved,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [original] = useState(goal);
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: putGoal,
    onSuccess: async (response) => {
      await queryClient.cancelQueries({ queryKey: sharedKeys.goal, exact: true });
      queryClient.setQueryData(sharedKeys.goal, response);
      onSaved();
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (save.isPending) return;

    const form = new FormData(event.currentTarget);
    const title = formText(form, "title");
    const targetAmount = formNumber(form, "targetAmount");
    const targetDate = formText(form, "targetDate");
    if (targetAmount === null) return;

    save.mutate({ title, targetAmount, targetDate });
  }

  return (
    <form className={cardClass} onSubmit={submit}>
      <fieldset className="grid gap-4" disabled={save.isPending}>
        <legend className="text-text-strong mb-3 font-semibold">
          {USE_MOCK ? "[예시] " : ""}
          {original ? "목표 수정" : "새 목표"}
        </legend>
        <FormField name="title" label="목표 이름" error={save.error}>
          <input
            id="title"
            name="title"
            maxLength={50}
            required
            defaultValue={original?.title ?? ""}
            className={fieldClass}
          />
        </FormField>
        <FormField name="targetAmount" label="목표 금액 (원)" error={save.error}>
          <input
            id="targetAmount"
            name="targetAmount"
            type="number"
            min={1}
            max={maxAmount}
            step={1}
            inputMode="numeric"
            required
            defaultValue={original?.targetAmount ?? ""}
            className={fieldClass}
          />
        </FormField>
        <FormField name="targetDate" label="목표 날짜" error={save.error}>
          <input
            id="targetDate"
            name="targetDate"
            type="date"
            required
            defaultValue={original?.targetDate ?? ""}
            className={fieldClass}
          />
        </FormField>
        <FormActions pending={save.isPending} error={save.error} onCancel={onClose} />
      </fieldset>
    </form>
  );
}

export function GoalScreen() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const query = useQuery({ queryKey: sharedKeys.goal, queryFn: getGoal });
  const goal = query.data?.data;

  return (
    <MypageScreen title="목표" description="내 금융 목표를 세우고 진행률을 확인해요.">
      {query.isPending && <Loading />}
      {query.isError && goal === undefined && <LoadError onRetry={() => void query.refetch()} />}
      {saved && (
        <p role="status" className="text-primary text-sm">
          목표를 저장했어요.
        </p>
      )}
      {goal !== undefined &&
        (editing ? (
          <GoalForm
            goal={goal}
            onClose={() => setEditing(false)}
            onSaved={() => {
              setEditing(false);
              setSaved(true);
            }}
          />
        ) : (
          <section className={cardClass} aria-labelledby="goal-summary">
            <h2 id="goal-summary" className="text-text-strong mb-2 font-semibold wrap-anywhere">
              {goal ? `${USE_MOCK ? "[예시] " : ""}${goal.title}` : "아직 목표가 없어요."}
            </h2>
            {goal && (
              <dl className="divide-line divide-y">
                <InfoRow label="목표 금액">{formatKRW(goal.targetAmount)}</InfoRow>
                <InfoRow label="목표 날짜">{formatDotDate(goal.targetDate)}</InfoRow>
                <InfoRow label="목표 진행률">{formatPercent(goal.progressPercent)}</InfoRow>
              </dl>
            )}
            <button
              className={buttonClass + " mt-3 w-full"}
              type="button"
              onClick={() => {
                setSaved(false);
                setEditing(true);
              }}
            >
              {goal ? "수정해요" : "목표를 만들어요"}
            </button>
          </section>
        ))}
    </MypageScreen>
  );
}
