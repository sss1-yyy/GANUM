"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { USE_MOCK } from "@/shared/api/config";
import { formatKRW, formatSignedKRW } from "@/shared/lib/format";
import { assetKeys, connectAssets, getAccounts, getAssetSummary } from "../api";
import { referenceDate } from "@/shared/lib/format-time";
import { AssetAllocationCard } from "./AssetAllocationCard";
import { AssetHistoryCard } from "./AssetHistoryCard";

const investmentLinks = [
  { label: "예적금", href: "/assets/savings", categories: ["DEPOSIT"] },
  { label: "증권", href: "/assets/stocks", categories: ["STOCK", "ETF"] },
  { label: "코인", href: "/assets/coins", categories: ["CRYPTO"] },
] as const;

const accountGroups = [
  { type: "CASH", title: "입출금 계좌" },
  { type: "STOCK", title: "주식 계좌" },
] as const;

export function AssetsScreen() {
  const queryClient = useQueryClient();
  const summary = useQuery({
    queryKey: assetKeys.summary,
    queryFn: getAssetSummary,
  });
  const connection = useMutation({
    mutationFn: connectAssets,
    onSuccess: (response) => {
      queryClient.setQueryData(assetKeys.summary, response);
    },
  });

  const assets = summary.data?.data;
  const isConnected =
    assets?.connectionStatus === "CONNECTED" || assets?.connectionStatus === "PARTIAL";

  const accounts = useQuery({
    queryKey: assetKeys.accounts,
    queryFn: getAccounts,
    enabled: isConnected,
  });
  const accountItems = isConnected ? accounts.data?.data.items : [];

  return (
    <ScreenFrame className="gap-4">
      <h1 className="text-title text-text-strong font-semibold">내 자산</h1>

      {summary.isPending && <p role="status">자산 정보를 불러오고 있어요.</p>}

      {summary.isError && (
        <div>
          <p role="alert">자산 정보를 불러오지 못했어요.</p>
          <button type="button" onClick={() => void summary.refetch()}>
            다시 시도하기
          </button>
        </div>
      )}

      {assets && !isConnected && (
        <section className="rounded-card bg-sub space-y-3 p-4">
          <p className="text-text-strong font-semibold">내 금융정보를 한곳에 모아 정리해요.</p>
          <button
            type="button"
            disabled={connection.isPending}
            onClick={() => connection.mutate()}
            className="rounded-button bg-primary text-surface w-full py-3 font-semibold"
          >
            {connection.isPending ? "연결하고 있어요" : "금융기관 연결하기"}
          </button>
          {connection.isError && (
            <p role="alert" className="text-danger">
              금융기관을 연결하지 못했어요. 다시 시도해 주세요.
            </p>
          )}
        </section>
      )}

      {assets && isConnected && (
        <section className="rounded-card bg-primary text-surface p-4">
          <h2>{USE_MOCK ? "[예시] 내 총 자산" : "내 총 자산"}</h2>
          <p className="mt-2 text-2xl font-bold">{formatKRW(assets.totalAssets)}</p>
          {assets.monthlyChangeAmount !== null && (
            <p className="text-caption mt-2">
              지난달 대비 {formatSignedKRW(assets.monthlyChangeAmount)}
            </p>
          )}
        </section>
      )}

      {isConnected && <AssetHistoryCard to={referenceDate(summary.data?.meta?.asOf)} />}

      {assets && isConnected && <AssetAllocationCard categories={assets.categories} />}

      {assets && (
        <section className="rounded-card bg-surface shadow-card space-y-4 p-4">
          <h2 className="text-text-strong font-semibold">{USE_MOCK ? "[예시] 계좌" : "계좌"}</h2>

          {isConnected && accounts.isPending && <p role="status">계좌를 불러오고 있어요.</p>}

          {isConnected && accounts.isError && (
            <div>
              <p role="alert" className="text-danger">
                계좌를 불러오지 못했어요.
              </p>
              <button type="button" onClick={() => void accounts.refetch()}>
                다시 시도하기
              </button>
            </div>
          )}

          {accountItems &&
            accountGroups.map(({ type, title }) => {
              const items = accountItems.filter((account) => account.type === type);
              const total = items.reduce((sum, account) => sum + account.balance, 0);

              return (
                <div key={type}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{title}</h3>
                    <span className="text-caption text-text-sub">합계 {formatKRW(total)}</span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-caption text-text-sub mt-2">연결된 계좌가 없어요.</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {items.map((account) => (
                        <li key={account.id} className="flex items-center justify-between gap-2">
                          <div>
                            <p>{account.institution}</p>
                            <p className="text-caption text-text-sub">{account.name}</p>
                          </div>
                          <span className="shrink-0 font-semibold">
                            {formatKRW(account.balance)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
        </section>
      )}

      {assets && (
        <section className="rounded-card bg-surface shadow-card space-y-3 p-4">
          <h2 className="font-semibold">{USE_MOCK && isConnected ? "[예시] 투자" : "투자"}</h2>

          {investmentLinks.map(({ label, href, categories }) => {
            const amount = isConnected
              ? assets.categories.reduce(
                  (sum, category) =>
                    categories.some((type) => type === category.type) ? sum + category.amount : sum,
                  0,
                )
              : 0;

            return (
              <Link
                key={href}
                href={href}
                className="rounded-button bg-sub flex items-center gap-2 p-3"
              >
                <span className="flex-1">{label}</span>
                <span className="font-semibold">{formatKRW(amount)}</span>
                <span aria-hidden="true">›</span>
              </Link>
            );
          })}
        </section>
      )}

      {assets && !isConnected && <AssetAllocationCard categories={[]} />}
    </ScreenFrame>
  );
}
