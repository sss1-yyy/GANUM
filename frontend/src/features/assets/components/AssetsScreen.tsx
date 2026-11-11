"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { formatKRW } from "@/shared/lib/format";
import { assetKeys, connectAssets, getAccounts, getAssetSummary } from "../api";
import { AssetAllocationCard } from "./AssetAllocationCard";
import { AssetSummaryCard } from "./AssetSummaryCard";
import Image, { type StaticImageData } from "next/image";
import investmentChevron from "../assets/investment-chevron-right.svg";
import savingsIcon from "../assets/investment-savings.svg";
import stocksIcon from "../assets/investment-stocks.svg";
import coinsIcon from "../assets/investment-coins.svg";
import kakaoBankIcon from "../assets/account-kakaobank.svg";
import tossBankIcon from "../assets/account-tossbank.svg";
import hanaBankIcon from "../assets/account-hanabank.svg";

const bankIcons = new Map<string, StaticImageData>([
  ["카카오뱅크", kakaoBankIcon],
  ["토스뱅크", tossBankIcon],
  ["하나은행", hanaBankIcon],
]);

const investmentLinks = [
  { label: "예적금", href: "/assets/savings", categories: ["DEPOSIT"], icon: savingsIcon },
  { label: "증권", href: "/assets/stocks", categories: ["STOCK", "ETF"], icon: stocksIcon },
  { label: "코인", href: "/assets/coins", categories: ["CRYPTO"], icon: coinsIcon },
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
    <ScreenFrame tabBar className="gap-4">
      <h1 className="text-title text-text-strong font-semibold">내 자산</h1>

      {summary.isPending && <p role="status">자산 정보를 불러오고 있어요.</p>}

      {summary.isError && (
        <div>
          <p role="alert" className="text-danger">
            자산 정보를 불러오지 못했어요.
          </p>
          <button type="button" onClick={() => void summary.refetch()}>
            다시 시도하기
          </button>
        </div>
      )}

      {assets && !isConnected && (
        <section className="rounded-card bg-sub space-y-3 p-4">
          <p className="text-text-strong font-semibold">
            내 금융정보를 한곳에 모아 자동으로 정리해요
          </p>
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
        <AssetSummaryCard
          title="내 총 자산"
          totalAmount={assets.totalAssets}
          monthlyChangeAmount={assets.monthlyChangeAmount}
        />
      )}

      {assets && isConnected && <AssetAllocationCard categories={assets.categories} />}

      {assets && (
        <section className="rounded-card bg-surface shadow-card space-y-4 p-4">
          <h2 className="text-text-strong font-semibold">계좌</h2>

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
                    <div className="text-caption text-text-sub mt-2 flex items-center gap-2">
                      <span aria-hidden="true" className="bg-line size-10 shrink-0 rounded-full" />
                      <span className="flex-1">연결된 계좌가 없어요</span>
                      <span className="shrink-0">--원</span>
                    </div>
                  ) : (
                    <ul className="mt-2 space-y-6">
                      {items.map((account) => {
                        const icon =
                          account.type === "STOCK"
                            ? stocksIcon
                            : bankIcons.get(account.institution);

                        return (
                          <li key={account.id} className="flex items-center justify-between gap-3">
                            {icon ? (
                              <Image
                                src={icon}
                                alt=""
                                width={40}
                                height={40}
                                className="shrink-0 rounded-full"
                              />
                            ) : (
                              <span
                                aria-hidden="true"
                                className="bg-line size-10 shrink-0 rounded-full"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <p>{account.type === "STOCK" ? account.name : account.institution}</p>
                              <p className="text-caption text-text-sub">
                                {account.type === "STOCK" ? "주식" : account.name}
                              </p>
                            </div>
                            <span className="shrink-0 font-semibold">
                              {formatKRW(account.balance)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
        </section>
      )}

      {assets && (
        <section className="rounded-card bg-surface shadow-card space-y-3 p-4">
          <h2 className="font-semibold">투자</h2>
          <p className="text-caption text-text-sub">투자 자산 3개를 한눈에 확인해요</p>

          {investmentLinks.map(({ label, href, categories, icon }) => {
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
                className="rounded-button bg-bg flex items-center gap-3 p-3"
              >
                <Image src={icon} alt="" width={32} height={32} className="shrink-0" />
                <span className="flex-1">{label}</span>
                <span className="shrink-0 font-semibold">{formatKRW(amount)}</span>
                <Image src={investmentChevron} alt="" width={6} height={10} className="shrink-0" />
              </Link>
            );
          })}
        </section>
      )}

      {assets && !isConnected && <AssetAllocationCard categories={[]} />}
    </ScreenFrame>
  );
}
