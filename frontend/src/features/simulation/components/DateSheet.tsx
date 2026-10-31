"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { formatDotDate } from "@/shared/lib/format";
import chevronNext from "../assets/chevron-next.svg";
import chevronPrev from "../assets/chevron-prev.svg";
import { dateOf, daysInMonth, firstWeekday, shiftMonths, yearMonthOf } from "../dates";
import { BottomSheet, Chip, SheetCta } from "./BottomSheet";

const QUICK_PICKS = [
  { months: 1, label: "1개월 전" },
  { months: 3, label: "3개월 전" },
  { months: 6, label: "6개월 전" },
  { months: 12, label: "1년 전" },
];

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 날짜 고르기 시트. base(가장 최근 거래일)에서 빠른 선택 칩을 계산하고,
 * max 보다 뒤의 날은 고를 수 없어요.
 */
export function DateSheet({
  title,
  description,
  initial,
  base,
  max,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  initial: string | null;
  base: string;
  max: string;
  onConfirm: (date: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(initial);
  const [view, setView] = useState(() => yearMonthOf(initial ?? max));

  const pick = (date: string) => {
    setSelected(date);
    setView(yearMonthOf(date));
  };
  const moveMonth = (delta: number) =>
    setView(yearMonthOf(shiftMonths(dateOf(view.year, view.month, 1), delta)));

  const maxMonth = yearMonthOf(max);
  const atMaxMonth = view.year === maxMonth.year && view.month === maxMonth.month;
  const blanks = firstWeekday(view.year, view.month);
  const days = daysInMonth(view.year, view.month);
  const cells: Array<number | null> = [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  return (
    <BottomSheet title={title} description={description} onClose={onClose}>
      <div className="flex gap-2">
        {QUICK_PICKS.map(({ months, label }) => {
          const date = shiftMonths(base, -months);
          return (
            <Chip key={months} active={selected === date} onClick={() => pick(date)}>
              {label}
            </Chip>
          );
        })}
      </div>

      <div className="rounded-card bg-surface shadow-card flex flex-col gap-4 px-[18px] py-5">
        <div className="flex items-center justify-between">
          <button type="button" aria-label="이전 달" onClick={() => moveMonth(-1)}>
            <Image src={chevronPrev} alt="" width={16} height={16} />
          </button>
          <p className="text-subtitle text-text-strong font-semibold">
            {view.year}년 {view.month}월
          </p>
          <button
            type="button"
            aria-label="다음 달"
            disabled={atMaxMonth}
            onClick={() => moveMonth(1)}
            className="disabled:opacity-30"
          >
            <Image src={chevronNext} alt="" width={16} height={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 justify-items-center gap-y-1">
          {WEEKDAYS.map((day, i) => (
            <span
              key={day}
              className={cn(
                "text-caption flex size-9 items-center justify-center font-medium",
                i === 0 ? "text-positive" : "text-text-muted",
              )}
            >
              {day}
            </span>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <span key={`blank-${i}`} className="size-9" />;
            const date = dateOf(view.year, view.month, day);
            const on = date === selected;
            const disabled = date > max;
            return (
              <button
                key={date}
                type="button"
                disabled={disabled}
                aria-pressed={on}
                aria-label={formatDotDate(date)}
                onClick={() => setSelected(date)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full",
                  on && "bg-primary",
                )}
              >
                {/* Figma: 일요일 숫자는 빨강 */}
                <span
                  className={cn(
                    "text-[14px]",
                    on
                      ? "text-surface font-bold"
                      : disabled
                        ? "text-outline font-medium"
                        : (blanks + day - 1) % 7 === 0
                          ? "text-positive font-medium"
                          : "text-text-strong font-medium",
                  )}
                >
                  {day}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <SheetCta disabled={!selected} onClick={() => selected && onConfirm(selected)}>
        {selected ? `${formatDotDate(selected)} 선택` : "날짜를 골라 주세요"}
      </SheetCta>
    </BottomSheet>
  );
}
