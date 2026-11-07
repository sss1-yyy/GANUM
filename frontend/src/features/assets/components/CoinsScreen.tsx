"use client";

import { useQuery } from "@tanstack/react-query";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { cn } from "@/shared/lib/cn";
import { changeTone, formatKRW, formatSignedPercent } from "@/shared/lib/format";
import { assetKeys, getCrypto } from "../api";
import { AssetSummaryCard } from "./AssetSummaryCard";
import Image, { type StaticImageData } from "next/image";
import btcIcon from "../assets/coin-btc.svg";
import ethIcon from "../assets/coin-eth.svg";
import solIcon from "../assets/coin-sol.svg";
import xrpIcon from "../assets/coin-xrp.svg";
import defaultCoinIcon from "../assets/investment-coins.svg";

const coinIcons = new Map<string, StaticImageData>([
  ["BTC", btcIcon],
  ["ETH", ethIcon],
  ["XRP", xrpIcon],
  ["SOL", solIcon],
]);

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
          <AssetSummaryCard
            title="코인 총 자산"
            totalAmount={detail.totalAmount}
            monthlyChangeAmount={detail.monthlyChangeAmount}
          />

          <section className="rounded-card bg-surface shadow-card space-y-3 p-4">
            <h2 className="font-semibold">보유 코인</h2>
            {detail.items.length === 0 ? (
              <p className="text-caption text-text-sub">보유한 코인이 없어요.</p>
            ) : (
              <ul className="space-y-6">
                {detail.items.map((item) => {
                  const tone = changeTone(item.changePercent);

                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3">
                      <Image
                        src={coinIcons.get(item.symbol) ?? defaultCoinIcon}
                        alt=""
                        width={40}
                        height={40}
                        className="shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-caption text-text-sub">
                          {item.quantity} {item.symbol}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold">{formatKRW(item.amount)}</p>
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
