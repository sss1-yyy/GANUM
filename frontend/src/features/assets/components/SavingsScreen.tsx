"use client";

import { useQuery } from "@tanstack/react-query";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { USE_MOCK } from "@/shared/api/config";
import { formatKRW } from "@/shared/lib/format";
import { assetKeys, getSavings } from "../api";

export function SavingsScreen() {
  const savings = useQuery({
    queryKey: assetKeys.savings,
    queryFn: getSavings,
  });
  const detail = savings.data?.data;

  return (
    <ScreenFrame className="gap-4">
      <h1 className="text-title text-text-strong font-semibold">예적금</h1>

      {savings.isPending && <p role="status">예적금 정보를 불러오고 있어요.</p>}

      {savings.isError && (
        <div>
          <p role="alert" className="text-danger">
            예적금 정보를 불러오지 못했어요.
          </p>
          <button type="button" onClick={() => void savings.refetch()}>
            다시 시도하기
          </button>
        </div>
      )}

      {detail && (
        <>
          <section className="rounded-card bg-primary text-surface p-4">
            <h2>{USE_MOCK ? "[예시] 예적금 총 자산" : "예적금 총 자산"}</h2>
            <p className="mt-2 text-2xl font-bold">{formatKRW(detail.totalAmount)}</p>
            {detail.monthlyChangeAmount !== null && (
              <p className="text-caption mt-2">
                지난달 대비 {detail.monthlyChangeAmount > 0 ? "+" : ""}
                {formatKRW(detail.monthlyChangeAmount)}
              </p>
            )}
          </section>

          <section className="rounded-card bg-surface shadow-card space-y-3 p-4">
            <h2 className="font-semibold">예적금 상품</h2>
            {detail.items.length === 0 ? (
              <p className="text-caption text-text-sub">연결된 예적금이 없어요.</p>
            ) : (
              <ul className="space-y-3">
                {detail.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-caption text-text-sub">
                        연 {item.interestRate}%
                        {item.termMonths !== null && ` · ${item.termMonths}개월`}
                      </p>
                    </div>
                    <span className="shrink-0">{formatKRW(item.balance)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </ScreenFrame>
  );
}
