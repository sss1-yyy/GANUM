import type { ReactNode } from "react";
import { isApiError } from "@/shared/api";
import { buttonClass, secondaryButtonClass } from "./MypageScreen";

export const fieldClass =
  "bg-surface border-outline min-h-11 w-full rounded-xl border px-3 py-2 text-text-strong";
export const maxAmount = 1_000_000_000_000;

export function formText(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

export function formNumber(form: FormData, name: string) {
  const value = formText(form, name);
  return value === "" ? null : Number(value);
}

export function FormField({
  name,
  label,
  error,
  children,
}: {
  name: string;
  label: string;
  error: unknown;
  children: ReactNode;
}) {
  const message = isApiError(error)
    ? error.fields.find((field) => field.field === name)?.message
    : undefined;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={name} className="text-text-strong text-sm font-semibold">
        {label}
      </label>
      {children}
      {message && <p className="text-danger text-sm">{message}</p>}
    </div>
  );
}

export function FormActions({
  pending,
  error,
  onCancel,
}: {
  pending: boolean;
  error: unknown;
  onCancel: () => void;
}) {
  return (
    <>
      {error != null && (
        <p role="alert" className="text-danger text-sm">
          {isApiError(error) ? error.message : "저장하지 못했어요. 다시 시도해 주세요."}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onCancel}
          disabled={pending}
        >
          취소
        </button>
        <button type="submit" className={buttonClass} disabled={pending}>
          {pending ? "저장 중이에요" : "저장해요"}
        </button>
      </div>
    </>
  );
}
