"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useState } from "react";
import { InstrumentLogo } from "@/components/domain/InstrumentLogo";
import { getInstruments, type InstrumentsQuery } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { cn } from "@/shared/lib/cn";
import type { Instrument, InstrumentType } from "@/shared/types";
import checkOn from "../assets/check-on.svg";
import search from "../assets/search.svg";
import { BottomSheet, Chip, SheetCta } from "./BottomSheet";

/** OVERSEAS(해외)는 API 종류에 없어서 칩만 두고 "준비 중"을 보여줘요 (docs/figma-api-gaps.md) */
type TypeFilter = "ALL" | InstrumentType | "OVERSEAS";

const TYPE_CHIPS: Array<{ value: TypeFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "STOCK", label: "국내 주식" },
  { value: "ETF", label: "ETF" },
  { value: "OVERSEAS", label: "해외" },
];

/**
 * 종목 고르기 시트.
 * - max 가 1 이면 하나만 골라요(누르면 바뀜). 2 이상이면 min~max 개를 골라요.
 * - showTypeChips 가 false 면 종류 칩 없이 전체 목록만 보여줘요(Figma Q2).
 */
export function InstrumentSheet({
  title,
  description,
  listLabel,
  initial,
  min = 1,
  max = 1,
  showTypeChips = true,
  initialType = "ALL",
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  listLabel: string;
  initial: Instrument[];
  min?: number;
  max?: number;
  showTypeChips?: boolean;
  initialType?: TypeFilter;
  onConfirm: (selected: Instrument[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Instrument[]>(initial);
  const [type, setType] = useState<TypeFilter>(initialType);
  const [keyword, setKeyword] = useState("");
  // 입력을 멈추고 0.3초 뒤에 검색해요 (글자마다 요청하지 않도록)
  const [searchKeyword, setSearchKeyword] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSearchKeyword(keyword.trim()), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const overseas = type === "OVERSEAS";
  const params: InstrumentsQuery = {
    ...(searchKeyword ? { query: searchKeyword.slice(0, 50) } : {}),
    ...(type === "STOCK" || type === "ETF" ? { type } : {}),
    limit: 20,
  };
  const list = useQuery({
    queryKey: sharedKeys.instruments(params),
    queryFn: async () => (await getInstruments(params)).data.items,
    enabled: !overseas,
    // 새 검색 결과가 올 때까지 이전 목록을 그대로 보여줘요
    placeholderData: keepPreviousData,
  });
  // "해외"는 "전체"와 조회 키가 같아 캐시가 남아 있으니 목록을 직접 비워요
  const items = overseas ? [] : list.data;

  const multiple = max > 1;
  const isSelected = (id: string) => selected.some((item) => item.id === id);
  const toggle = (instrument: Instrument) => {
    if (!multiple) return setSelected([instrument]);
    if (isSelected(instrument.id)) {
      setSelected(selected.filter((item) => item.id !== instrument.id));
    } else if (selected.length < max) {
      setSelected([...selected, instrument]);
    }
  };

  return (
    <BottomSheet title={title} description={description} onClose={onClose}>
      <label className="bg-bg flex h-12 items-center gap-2 rounded-[16px] px-4">
        <Image src={search} alt="" width={16} height={16} />
        <input
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="종목명 또는 코드 검색"
          className="text-text-strong placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-[14px] font-medium outline-none"
        />
      </label>

      {showTypeChips && (
        <div className="flex gap-2">
          {TYPE_CHIPS.map((chip) => (
            <Chip key={chip.value} active={type === chip.value} onClick={() => setType(chip.value)}>
              {chip.label}
            </Chip>
          ))}
        </div>
      )}

      <div className="text-caption flex justify-between font-semibold">
        <p className="text-text-strong">{searchKeyword ? "검색 결과" : listLabel}</p>
        <p className="text-primary">
          {multiple ? `${selected.length}/${max} 선택` : selected.length > 0 ? "1개 선택" : ""}
        </p>
      </div>

      <ul className="flex flex-col gap-4">
        {overseas && <SheetMessage>해외 종목은 아직 준비 중이에요.</SheetMessage>}
        {!overseas && list.isPending && <SheetMessage>불러오는 중…</SheetMessage>}
        {!overseas && list.isError && <SheetMessage danger>종목을 불러오지 못했어요.</SheetMessage>}
        {!overseas && items?.length === 0 && <SheetMessage>찾는 종목이 없어요.</SheetMessage>}
        {items?.map((instrument) => {
          const on = isSelected(instrument.id);
          const blocked = multiple && !on && selected.length >= max;
          return (
            <li key={instrument.id}>
              <button
                type="button"
                aria-pressed={on}
                disabled={blocked}
                onClick={() => toggle(instrument)}
                className={cn(
                  "rounded-card bg-surface shadow-card flex w-full items-center gap-3 border px-[18px] py-5 text-left disabled:opacity-50",
                  on ? "border-primary" : "border-transparent",
                )}
              >
                <InstrumentLogo instrumentId={instrument.id} name={instrument.name} />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-text-strong truncate text-[14px] font-semibold">
                    {instrument.name}
                  </span>
                  <span className="text-caption text-text-muted font-medium">
                    {instrument.symbol} · {instrument.type === "ETF" ? "ETF" : "주식"}
                  </span>
                </span>
                {on ? (
                  <Image src={checkOn} alt="" width={22} height={22} />
                ) : (
                  <span className="border-outline bg-surface size-[22px] shrink-0 rounded-[6px] border-[1.5px]" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <SheetCta disabled={selected.length < min} onClick={() => onConfirm(selected)}>
        {multiple ? `${selected.length}개 선택 완료` : "선택 완료"}
      </SheetCta>
    </BottomSheet>
  );
}

function SheetMessage({ danger = false, children }: { danger?: boolean; children: string }) {
  return (
    <li
      role={danger ? "alert" : undefined}
      className={cn("text-caption py-6 text-center", danger ? "text-danger" : "text-text-sub")}
    >
      {children}
    </li>
  );
}
