"use client";

import { useQuery } from "@tanstack/react-query";
import { InstrumentLogo } from "@/components/domain/InstrumentLogo";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { USE_MOCK } from "@/shared/api/config";
import { cn } from "@/shared/lib/cn";
import { changeTone, formatKRW, formatSignedKRW, formatSignedPercent } from "@/shared/lib/format";
import { assetKeys, getAssetHoldings } from "../api";

export function StocksScreen() {
  const holdings = useQuery({
    queryKey: assetKeys.holdings,
    queryFn: getAssetHoldings,
  });
  const detail = holdings.data?.data;
  const items = detail?.items ?? [];
  const total = items.reduce((sum, item) => sum + item.marketValue, 0);
  const profitLoss = items.reduce((sum, item) => sum + (item.profitLoss ?? 0), 0);
  const hasProfitLoss = items.length > 0 && items.every((item) => item.profitLoss !== null);

  return (
    <ScreenFrame className="gap-4">
      <h1 className="text-title text-text-strong font-semibold">증권</h1>

      {holdings.isPending && <p role="status">증권 정보를 불러오고 있어요.</p>}

      {holdings.isError && (
        <div>
          <p role="alert" className="text-danger">
            증권 정보를 불러오지 못했어요.
          </p>
          <button type="button" onClick={() => void holdings.refetch()}>
            다시 시도하기
          </button>
        </div>
      )}

      {detail && (
        <>
          <section className="rounded-card bg-primary text-surface p-4">
            <h2>
              {USE_MOCK && "[예시] "}
              {detail.nextCursor === null ? "총 평가금액" : "표시된 종목 평가금액"}
            </h2>
            <p className="mt-2 text-2xl font-bold">{formatKRW(total)}</p>
            {hasProfitLoss && (
              <p className="text-caption mt-2">평가 손익 {formatSignedKRW(profitLoss)}</p>
            )}
          </section>

          <section className="rounded-card bg-surface shadow-card space-y-3 p-4">
            <h2 className="font-semibold">보유 종목</h2>
            {items.length === 0 ? (
              <p className="text-caption text-text-sub">보유한 종목이 없어요.</p>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => {
                  const tone = changeTone(item.profitLossPercent);

                  return (
                    <li key={item.instrumentId} className="flex items-center gap-3">
                      <InstrumentLogo instrumentId={item.instrumentId} name={item.name} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-caption text-text-sub">{item.quantity}주</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p>{formatKRW(item.marketValue)}</p>
                        <p
                          className={cn(
                            "text-caption",
                            tone === "up" && "text-positive",
                            tone === "down" && "text-negative",
                            tone === "flat" && "text-text-sub",
                          )}
                        >
                          {formatSignedPercent(item.profitLossPercent)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {items.length > 0 && (
            <p className="text-caption text-text-sub">과거 결과이며 앞으로를 보장하지 않아요.</p>
          )}
        </>
      )}
    </ScreenFrame>
  );
}
