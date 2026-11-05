"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { USE_MOCK } from "@/shared/api";
import { getInstrument } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { formatDotDate, formatKRW, formatNumber } from "@/shared/lib/format";
import { getOrderRecords, mypageKeys } from "../api";
import type { OrderRecord } from "../types";
import {
  cardClass,
  InfoRow,
  LoadError,
  Loading,
  MypageScreen,
  secondaryButtonClass,
} from "./MypageScreen";

function OrderRow({ order }: { order: OrderRecord }) {
  // PAPER-04는 종목 ID만 내려줘요. MARKET-02로 이름을 확인하고 실패하면 ID를 표시해요.
  const instrument = useQuery({
    queryKey: sharedKeys.instrument(order.instrumentId),
    queryFn: () => getInstrument(order.instrumentId),
  });

  return (
    <li className={cardClass}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="text-text-strong font-semibold wrap-anywhere">
          {instrument.data?.data.name ?? order.instrumentId}
        </h2>
        <time dateTime={order.createdAt} className="text-text-sub shrink-0 text-xs">
          {formatDotDate(order.createdAt)}
        </time>
      </div>
      <dl className="divide-line divide-y">
        <InfoRow label="주문 유형">{order.side === "BUY" ? "매수" : "매도"}</InfoRow>
        <InfoRow label="수량">{formatNumber(order.quantity)}주</InfoRow>
        <InfoRow label="체결 단가">{formatKRW(order.unitPrice)}</InfoRow>
        <InfoRow label="거래 금액">{formatKRW(order.grossAmount)}</InfoRow>
      </dl>
    </li>
  );
}

export function OrdersScreen() {
  const query = useInfiniteQuery({
    queryKey: [...mypageKeys.orders, "history"],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => getOrderRecords(pageParam, signal),
    getNextPageParam: (lastPage) => lastPage.data.nextCursor,
  });
  const orders = query.data?.pages.flatMap((page) => page.data.items);

  return (
    <MypageScreen title="주문 내역" description="가상 자금 · 실제 돈이 아니에요">
      {query.isPending && <Loading />}
      {query.isError && !orders && <LoadError onRetry={() => void query.refetch()} />}
      {orders && orders.length === 0 && <p className={cardClass}>아직 모의 주문 내역이 없어요.</p>}
      {orders && orders.length > 0 && (
        <>
          {USE_MOCK && <p className="text-text-sub text-sm">[예시] 모의 주문 내역</p>}
          <ul className="grid gap-4" aria-label="모의 주문 내역">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
        </>
      )}
      {query.isFetchNextPageError && (
        <p role="alert" className="text-danger text-sm">
          다음 주문 내역을 불러오지 못했어요.
        </p>
      )}
      {query.hasNextPage && (
        <button
          type="button"
          className={secondaryButtonClass}
          disabled={query.isFetching}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? "불러오고 있어요" : "주문 내역 더 보기"}
        </button>
      )}
    </MypageScreen>
  );
}
