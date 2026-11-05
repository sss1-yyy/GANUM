"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { USE_MOCK } from "@/shared/api";
import { getFinancialProfile, patchFinancialProfile } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { formatDotDate, formatKRW } from "@/shared/lib/format";
import type { FinancialProfile } from "@/shared/types";
import { fieldClass, FormActions, FormField, formNumber, formText, maxAmount } from "./MypageForm";
import { buttonClass, cardClass, InfoRow, LoadError, Loading, MypageScreen } from "./MypageScreen";

const occupations = { STUDENT: "학생", EMPLOYEE: "직장인", OTHER: "기타" };
const housingTypes = { FAMILY: "가족과 함께 거주", RENT: "임차", OWN: "자가", OTHER: "기타" };
const moneyFields = [
  ["monthlyIncome", "월 수입"],
  ["monthlyExpense", "월 지출"],
  ["debtAmount", "부채"],
  ["emergencyFund", "비상금"],
] as const;

function selectedOption<T extends string>(value: string, options: Record<T, string>): T | null {
  return Object.hasOwn(options, value) ? (value as T) : null;
}

function FinanceForm({
  profile,
  onClose,
  onSaved,
}: {
  profile: FinancialProfile;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [original] = useState(profile);
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: patchFinancialProfile,
    onSuccess: async (response) => {
      await queryClient.cancelQueries({ queryKey: sharedKeys.financialProfile, exact: true });
      queryClient.setQueryData(sharedKeys.financialProfile, response);
      onSaved();
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (save.isPending) return;

    const form = new FormData(event.currentTarget);
    const values = {
      birthYear: formNumber(form, "birthYear"),
      occupation: selectedOption(formText(form, "occupation"), occupations),
      housingType: selectedOption(formText(form, "housingType"), housingTypes),
      regionCode: formText(form, "regionCode") || null,
      monthlyIncome: formNumber(form, "monthlyIncome"),
      monthlyExpense: formNumber(form, "monthlyExpense"),
      debtAmount: formNumber(form, "debtAmount"),
      emergencyFund: formNumber(form, "emergencyFund"),
    } satisfies Omit<FinancialProfile, "updatedAt">;
    const changes = Object.fromEntries(
      Object.entries(values).filter(
        ([key, value]) => value !== original[key as keyof typeof values],
      ),
    );
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }
    save.mutate(changes);
  }

  return (
    <form className={cardClass} onSubmit={submit}>
      <fieldset className="grid gap-4" disabled={save.isPending}>
        <legend className="text-text-strong mb-3 font-semibold">
          {USE_MOCK ? "[예시] " : ""}재정 정보 수정
        </legend>
        <p className="text-text-sub text-sm">입력하지 않은 항목은 미입력으로 저장돼요.</p>
        <FormField name="birthYear" label="출생 연도" error={save.error}>
          <input
            id="birthYear"
            name="birthYear"
            type="number"
            min={1900}
            step={1}
            inputMode="numeric"
            defaultValue={original.birthYear ?? ""}
            className={fieldClass}
          />
        </FormField>
        <FormField name="occupation" label="직업" error={save.error}>
          <select
            id="occupation"
            name="occupation"
            defaultValue={original.occupation ?? ""}
            className={fieldClass}
          >
            <option value="">미입력</option>
            {Object.entries(occupations).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField name="housingType" label="주거 형태" error={save.error}>
          <select
            id="housingType"
            name="housingType"
            defaultValue={original.housingType ?? ""}
            className={fieldClass}
          >
            <option value="">미입력</option>
            {Object.entries(housingTypes).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
        {/* 지역명 목록이 확정되면 코드 입력을 선택 UI로 바꿔요. */}
        <FormField name="regionCode" label="거주 지역 코드" error={save.error}>
          <input
            id="regionCode"
            name="regionCode"
            defaultValue={original.regionCode ?? ""}
            className={fieldClass}
          />
        </FormField>
        {moneyFields.map(([name, label]) => (
          <FormField key={name} name={name} label={label + " (원)"} error={save.error}>
            <input
              id={name}
              name={name}
              type="number"
              min={0}
              max={maxAmount}
              step={1}
              inputMode="numeric"
              defaultValue={original[name] ?? ""}
              className={fieldClass}
            />
          </FormField>
        ))}
        <FormActions pending={save.isPending} error={save.error} onCancel={onClose} />
      </fieldset>
    </form>
  );
}

export function FinanceScreen() {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const query = useQuery({ queryKey: sharedKeys.financialProfile, queryFn: getFinancialProfile });
  const profile = query.data?.data;

  return (
    <MypageScreen title="재정 정보" description="내 재정 정보를 확인하고 수정해요.">
      {query.isPending && <Loading />}
      {query.isError && !profile && <LoadError onRetry={() => void query.refetch()} />}
      {saved && (
        <p role="status" className="text-primary text-sm">
          재정 정보를 저장했어요.
        </p>
      )}
      {profile &&
        (editing ? (
          <FinanceForm
            profile={profile}
            onClose={() => setEditing(false)}
            onSaved={() => {
              setEditing(false);
              setSaved(true);
            }}
          />
        ) : (
          <section className={cardClass} aria-labelledby="finance-summary">
            <h2 id="finance-summary" className="text-text-strong mb-2 font-semibold">
              {USE_MOCK ? "[예시] " : ""}내 재정 정보
            </h2>
            <dl className="divide-line divide-y">
              <InfoRow label="출생 연도">
                {profile.birthYear === null ? "미입력" : `${profile.birthYear}년`}
              </InfoRow>
              <InfoRow label="직업">
                {profile.occupation === null ? "미입력" : occupations[profile.occupation]}
              </InfoRow>
              <InfoRow label="주거 형태">
                {profile.housingType === null ? "미입력" : housingTypes[profile.housingType]}
              </InfoRow>
              <InfoRow label="거주 지역 코드">{profile.regionCode ?? "미입력"}</InfoRow>
              {moneyFields.map(([name, label]) => (
                <InfoRow key={name} label={label}>
                  {profile[name] === null ? "미입력" : formatKRW(profile[name])}
                </InfoRow>
              ))}
            </dl>
            <p className="text-text-sub my-3 text-xs">{formatDotDate(profile.updatedAt)} 수정</p>
            <button
              className={buttonClass + " w-full"}
              type="button"
              onClick={() => {
                setSaved(false);
                setEditing(true);
              }}
            >
              수정해요
            </button>
          </section>
        ))}
    </MypageScreen>
  );
}
