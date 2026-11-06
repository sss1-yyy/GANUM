"use client";

import { useQuery } from "@tanstack/react-query";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { USE_MOCK } from "@/shared/api/config";
import { cn } from "@/shared/lib/cn";
import { changeTone, formatKRW, formatSignedKRW, formatSignedPercent } from "@/shared/lib/format";
import { assetKeys, getCrypto } from "../api";

export function CoinsScreen() {
  const coins = useQuery({
    queryKey: assetKeys.crypto,
    queryFn: getCrypto,
  });
  const detail = coins.data?.data;

  return (
    <ScreenFrame className="gap-4">
      <h1 className="text-title text-text-strong font-semibold">코인</h1>

      {coins.isPending && <p role="status">코인 정보를 불러오고 있어요.</p>}

      {coins.isError && (
        <div>
          <p role="alert" className="text-danger">
            코인 정보를 불러오지 못했어요.
          </p>
          <button type="button" onClick={() => void coins.refetch()}>
            다시 시도하기
          </button>
        </div>
      )}

      {detail && (
        <>
          <section className="rounded-card bg-primary text-surface p-4">
            <h2>{USE_MOCK ? "[예시] 코인 총 자산" : "코인 총 자산"}</h2>
            <p className="mt-2 text-2xl font-bold">{formatKRW(detail.totalAmount)}</p>
            {detail.monthlyChangeAmount !== null && (
              <p className="text-caption mt-2">
                지난달 대비 {formatSignedKRW(detail.monthlyChangeAmount)}
              </p>
            )}
          </section>

          <section className="rounded-card bg-surface shadow-card space-y-3 p-4">
            <h2 className="font-semibold">보유 코인</h2>
            {detail.items.length === 0 ? (
              <p className="text-caption text-text-sub">보유한 코인이 없어요.</p>
            ) : (
              <ul className="space-y-3">
                {detail.items.map((item) => {
                  const tone = changeTone(item.changePercent);

                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-caption text-text-sub">
                          {item.quantity} {item.symbol}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p>{formatKRW(item.amount)}</p>
                        <p
                          className={cn(
                            "text-caption",
                            tone === "up" && "text-positive",
                            tone === "down" && "text-negative",
                            tone === "flat" && "text-text-sub",
                          )}
                        >
                          {formatSignedPercent(item.changePercent)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </ScreenFrame>
  );
}
