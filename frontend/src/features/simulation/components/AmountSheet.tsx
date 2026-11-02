"use client";

import { useState } from "react";
import { formatKRW, formatManWon } from "@/shared/lib/format";
import { BottomSheet, Chip, SheetCta } from "./BottomSheet";

export const MIN_MONTHLY_AMOUNT = 10_000;
const MAX_AMOUNT = 100_000_000;

const ADD_CHIPS = [
  { amount: 10_000, label: "+1만" },
  { amount: 50_000, label: "+5만" },
  { amount: 100_000, label: "+10만" },
  { amount: 500_000, label: "+50만" },
];

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "←"] as const;

/** 매달 넣을 금액 입력 시트 (원 단위 정수, 1만 원 ~ 1억 원) */
export function AmountSheet({
  initial,
  onConfirm,
  onClose,
}: {
  initial: number | null;
  onConfirm: (amount: number) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(initial ?? 0);
  const [lastChip, setLastChip] = useState<number | null>(null);

  const press = (key: (typeof KEYS)[number]) => {
    setLastChip(null);
    if (key === "←") return setAmount(Math.floor(amount / 10));
    const next = Number(`${amount}${key}`);
    if (next <= MAX_AMOUNT) setAmount(next);
  };
  const add = (value: number) => {
    setLastChip(value);
    setAmount(Math.min(amount + value, MAX_AMOUNT));
  };

  return (
    <BottomSheet
      title="매달 얼마씩 투자할까요?"
      description="1만 원부터 입력할 수 있어요"
      onClose={onClose}
    >
      <div className="flex flex-col gap-2">
        <p
          aria-live="polite"
          className={
            amount > 0
              ? "text-text-strong text-[28px] font-bold"
              : "text-text-muted text-[28px] font-bold"
          }
        >
          {formatKRW(amount)}
        </p>
        <div className="bg-primary h-0.5 w-full" />
        <p className="text-caption text-text-muted font-medium">
          {amount >= MIN_MONTHLY_AMOUNT
            ? `한 달에 ${formatManWon(amount)} · 1년이면 ${formatManWon(amount * 12)}`
            : "1만 원 이상 입력해 주세요"}
        </p>
      </div>

      <div className="flex gap-2">
        {ADD_CHIPS.map((chip) => (
          <Chip
            key={chip.amount}
            active={lastChip === chip.amount}
            onClick={() => add(chip.amount)}
          >
            {chip.label}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            aria-label={key === "←" ? "지우기" : key}
            onClick={() => press(key)}
            className="active:bg-bg flex h-[52px] items-center justify-center rounded-[12px]"
          >
            <span className="text-text-strong text-[22px] font-medium">{key}</span>
          </button>
        ))}
      </div>

      <SheetCta disabled={amount < MIN_MONTHLY_AMOUNT} onClick={() => onConfirm(amount)}>
        확인
      </SheetCta>
    </BottomSheet>
  );
}
