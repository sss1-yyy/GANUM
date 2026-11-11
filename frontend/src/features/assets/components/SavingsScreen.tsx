"use client";

import { useQuery } from "@tanstack/react-query";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { formatKRW, formatManWon, formatPercent } from "@/shared/lib/format";
import { assetKeys, getSavings } from "../api";
import { AssetSummaryCard } from "./AssetSummaryCard";
import Image from "next/image";
import depositIcon from "../assets/savings-lock.svg";
import sproutIcon from "../assets/savings-sprout.svg";
import piggyIcon from "../assets/savings-piggy.svg";
import shieldIcon from "../assets/savings-shield.svg";

function savingsIcon(name: string) {
  if (name.includes("도약")) return sproutIcon;
  if (name.includes("비상금")) return shieldIcon;
  if (name.includes("적금")) return piggyIcon;
  return depositIcon;
}

export function SavingsScreen() {
  const savings = useQuery({
    queryKey: assetKeys.savings,
    queryFn: getSavings,
  });
  const detail = savings.data?.data;

  return (
    <ScreenFrame tabBar className="gap-4">
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
          <AssetSummaryCard
            title="예적금 총 자산"
            totalAmount={detail.totalAmount}
            monthlyChangeAmount={detail.monthlyChangeAmount}
          />

          <section className="rounded-card bg-surface shadow-card space-y-3 p-4">
            <h2 className="font-semibold">예적금</h2>
            {detail.items.length === 0 ? (
              <p className="text-caption text-text-sub">연결된 예적금이 없어요.</p>
            ) : (
              <ul className="space-y-6">
                {detail.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3">
                    <Image
                      src={savingsIcon(item.name)}
                      alt=""
                      width={40}
                      height={40}
                      className="shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-caption text-text-sub">
                        {item.monthlyDeposit !== null &&
                          `월 ${formatManWon(item.monthlyDeposit)} · `}
                        연 {formatPercent(item.interestRate, 1)}
                        {item.monthlyDeposit === null &&
                          item.termMonths !== null &&
                          ` · ${item.termMonths}개월`}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold">{formatKRW(item.balance)}</span>
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
