"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { getInstrument, getPaperPortfolio } from "@/shared/api/endpoints";
import { isApiError } from "@/shared/api/error";
import { createIdempotencyKey } from "@/shared/api/idempotency";
import { sharedKeys } from "@/shared/api/query-keys";
import { formatKRW, formatNumber } from "@/shared/lib/format";
import { placeOrder } from "../api";
import type { OrderSide, PaperOrderResult } from "../types";

/** PAPER-03 오류 코드 → 사용자 안내 문구 (API 명세서 v0.4) */
const ORDER_ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_BALANCE: "가상 자금이 부족해요. 수량을 줄여 보세요.",
  INSUFFICIENT_HOLDINGS: "보유 수량보다 많이 팔 수 없어요.",
  INVALID_QUANTITY: "수량은 1 이상의 정수여야 해요.",
  IDEMPOTENCY_CONFLICT: "같은 주문이 이미 처리됐어요. 화면을 새로고침해 주세요.",
};

/** 매수/매도 주문 (PAPER-03). side 는 종목 상세의 버튼에서 넘어와요 */
export function OrderScreen({ instrumentId, side }: { instrumentId: string; side: OrderSide }) {
  const queryClient = useQueryClient();

  const [quantityText, setQuantityText] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  /** 같은 주문을 다시 보낼 때 같은 키를 재사용해요 (PAPER-03 Idempotency-Key). 수량을 바꾸면 새 키 */
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey("paper"));
  const [result, setResult] = useState<PaperOrderResult | null>(null);

  const detail = useQuery({
    queryKey: sharedKeys.instrument(instrumentId),
    queryFn: () => getInstrument(instrumentId),
  });
  const portfolio = useQuery({
    queryKey: sharedKeys.paperPortfolio,
    queryFn: () => getPaperPortfolio(),
  });

  const order = useMutation({
    mutationFn: () =>
      placeOrder({ instrumentId, side, quantity: Number(quantityText) }, idempotencyKey),
    onSuccess: (response) => {
      setResult(response.data);
      setSheetOpen(false);
      // 체결로 현금·보유가 바뀌었으니 포트폴리오를 다시 불러오게 해요
      void queryClient.invalidateQueries({ queryKey: sharedKeys.paperPortfolio });
      void queryClient.invalidateQueries({ queryKey: ["paper", "orders"] });
    },
  });

  if (detail.isPending || portfolio.isPending) {
    return (
      <ScreenFrame>
        <p className="text-caption text-text-sub py-20 text-center">불러오는 중…</p>
      </ScreenFrame>
    );
  }
  if (detail.isError || portfolio.isError) {
    return (
      <ScreenFrame className="items-center gap-3 py-20">
        <p role="alert" className="text-caption text-danger">
          주문 정보를 불러오지 못했어요.
        </p>
        <button
          type="button"
          onClick={() => {
            void detail.refetch();
            void portfolio.refetch();
          }}
          className="rounded-button bg-sub px-5 py-2"
        >
          <span className="text-caption text-primary font-semibold">다시 시도하기</span>
        </button>
      </ScreenFrame>
    );
  }

  const item = detail.data.data;
  const paper = portfolio.data.data;
  const holding = paper.holdings.find((entry) => entry.instrumentId === instrumentId) ?? null;
  const holdingQuantity = holding ? Number(holding.quantity) : 0;

  const isBuy = side === "BUY";
  const sideLabel = isBuy ? "매수" : "매도";
  // 체결가는 시장가(현재가) 기준이에요 (MVP: 즉시 전량 체결)
  const maxQuantity = isBuy ? Math.floor(paper.cashBalance / item.price) : holdingQuantity;
  const quantity = /^\d+$/.test(quantityText) ? Number(quantityText) : 0;
  const orderAmount = quantity * item.price;
  const cashAfter = isBuy ? paper.cashBalance - orderAmount : paper.cashBalance + orderAmount;
  const canSubmit = quantity >= 1 && quantity <= maxQuantity;

  // 주문 확인 시트의 "주식 비중" 안내 — 서버 계산이 아니라 화면에서 구한 안내값 (docs/figma-api-gaps.md)
  const investedNow = paper.totalValue > 0 ? (paper.holdingsValue / paper.totalValue) * 100 : 0;
  const holdingsAfter = isBuy
    ? paper.holdingsValue + orderAmount
    : paper.holdingsValue - orderAmount;
  const investedAfter = paper.totalValue > 0 ? (holdingsAfter / paper.totalValue) * 100 : 0;

  const changeQuantity = (next: number) => {
    const clamped = Math.max(0, Math.min(maxQuantity, next));
    setQuantityText(clamped === 0 ? "" : String(clamped));
    // 주문 내용이 바뀌면 새 주문이니 멱등 키도 새로 만들어요
    setIdempotencyKey(createIdempotencyKey("paper"));
    order.reset();
  };

  const errorMessage =
    order.error !== null
      ? isApiError(order.error)
        ? (ORDER_ERROR_MESSAGES[order.error.code] ?? order.error.message)
        : "주문을 처리하지 못했어요. 잠시 후 다시 시도해 주세요."
      : null;

  // ── 주문 완료 화면 ───────────────────────────────────────────
  if (result) {
    return (
      <ScreenFrame hideBack className="items-center gap-0 pt-20">
        <span
          aria-hidden
          className="shadow-ai flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-[#9079f6] to-[#6a4cf0]"
        >
          <svg
            viewBox="0 0 24 24"
            className="text-surface size-12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h1 className="text-title text-text-strong mt-6 font-bold">
          모의 {sideLabel}가 완료됐어요
        </h1>
        <p className="text-caption text-text-sub mt-1.5">실제 돈은 사용되지 않았어요</p>

        <dl className="rounded-card bg-bg mt-8 flex w-full flex-col gap-2.5 p-4">
          <div className="flex items-center justify-between">
            <dt className="text-text-sub text-[15px]">종목</dt>
            <dd className="text-text-strong font-semibold">
              {item.name} {formatNumber(result.quantity)}주
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-text-sub text-[15px]">체결 금액</dt>
            <dd className="text-text-strong font-semibold">{formatKRW(result.grossAmount)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-text-sub text-[15px]">남은 가상 자금</dt>
            <dd className="text-text-strong font-semibold">{formatKRW(result.cashBalanceAfter)}</dd>
          </div>
        </dl>

        <div className="mt-auto flex w-full flex-col gap-2.5 pt-8">
          <Link
            href="/portfolio"
            className="rounded-button bg-primary text-surface w-full py-3.5 text-center font-semibold"
          >
            내 포트폴리오 보기
          </Link>
          <Link
            href="/invest"
            className="rounded-button bg-sub text-primary w-full py-3.5 text-center font-semibold"
          >
            계속 둘러보기
          </Link>
        </div>
      </ScreenFrame>
    );
  }

  // ── 주문 입력 화면 ───────────────────────────────────────────
  return (
    <ScreenFrame className="gap-4">
      <header>
        <h1 className="text-title text-text-strong font-bold">{item.name}</h1>
        <p className="text-caption text-text-sub mt-0.5">현재가 {formatKRW(item.price)}</p>
      </header>

      {/* 수량 입력 */}
      <div className="border-line flex items-stretch overflow-hidden rounded-[12px] border">
        <button
          type="button"
          aria-label="수량 줄이기"
          onClick={() => changeQuantity(quantity - 1)}
          disabled={quantity <= 0}
          className="border-line text-text-strong w-14 shrink-0 border-r text-xl disabled:opacity-30"
        >
          −
        </button>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="수량"
          value={quantityText}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "");
            setQuantityText(digits.replace(/^0+(?=\d)/, ""));
            setIdempotencyKey(createIdempotencyKey("paper"));
            order.reset();
          }}
          className="text-text-strong min-w-0 flex-1 px-4 py-3.5 font-semibold outline-none"
        />
        <button
          type="button"
          aria-label="수량 늘리기"
          onClick={() => changeQuantity(quantity + 1)}
          disabled={quantity >= maxQuantity}
          className="border-line text-text-strong w-14 shrink-0 border-l text-xl disabled:opacity-30"
        >
          +
        </button>
      </div>

      {/* 시장가 (MVP 는 시장가 즉시 체결만 지원해요) */}
      <div className="bg-chip-gray flex items-center justify-between rounded-[12px] px-4 py-3.5">
        <span className="text-text-muted">시장가</span>
        <span className="text-text-strong font-semibold">{formatKRW(item.price)}</span>
      </div>

      <p className="text-caption text-text-sub">
        최대 가능 수량{" "}
        <span className="text-text-strong font-semibold">{formatNumber(maxQuantity)}주</span>
        {!isBuy && " (보유 수량)"}
      </p>

      {/* 주문 금액 요약 */}
      <section className="rounded-card bg-sub/60 p-4">
        <p className="text-caption text-text-sub">주문 금액</p>
        <p className="text-text-strong mt-1 text-[24px] leading-tight font-bold">
          {formatKRW(orderAmount)}
        </p>
        <dl className="border-line mt-3 flex flex-col gap-2 border-t pt-3">
          <div className="flex items-center justify-between">
            <dt className="text-text-sub text-[15px]">주문 가능 금액</dt>
            <dd className="text-text-strong font-semibold">{formatKRW(paper.cashBalance)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-text-sub text-[15px]">주문 후 남는 금액</dt>
            <dd className="text-text-strong font-semibold">{formatKRW(cashAfter)}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-auto pt-2">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => setSheetOpen(true)}
          className="rounded-button bg-primary text-surface w-full py-3.5 font-semibold disabled:opacity-40"
        >
          모의 {sideLabel}하기
        </button>
      </div>

      {/* 주문 확인 시트 */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setSheetOpen(false)}
            className="bg-text-strong/40 absolute inset-0"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="주문 확인"
            className="bg-surface sheet-enter relative w-full max-w-(--app-width) rounded-t-[24px] px-8 pt-6 pb-10"
          >
            <h2 className="text-title text-text-strong font-semibold">주문을 확인해 주세요</h2>
            <dl className="mt-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <dt className="text-text-sub text-[15px]">종목</dt>
                <dd className="text-text-strong font-semibold">{item.name}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-sub text-[15px]">수량</dt>
                <dd className="text-text-strong font-semibold">{formatNumber(quantity)}주</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-sub text-[15px]">{sideLabel} 금액</dt>
                <dd className="text-text-strong font-semibold">{formatKRW(orderAmount)}</dd>
              </div>
            </dl>

            <div className="rounded-card bg-sub mt-4 p-4">
              <p className="text-primary text-[15px] font-semibold">
                이 주문으로 모의 주식 비중이 {Math.round(investedAfter)}%가 돼요
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <WeightBar label="지금" percent={investedNow} />
                <WeightBar label="주문 후" percent={investedAfter} />
              </div>
            </div>

            {errorMessage && (
              <p role="alert" className="text-caption text-danger mt-3">
                {errorMessage}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="rounded-button bg-sub text-primary flex-1 py-3.5 font-semibold"
              >
                취소
              </button>
              <button
                type="button"
                disabled={order.isPending}
                onClick={() => order.mutate()}
                className="rounded-button bg-primary text-surface flex-1 py-3.5 font-semibold disabled:opacity-60"
              >
                {order.isPending ? "처리 중…" : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ScreenFrame>
  );
}

/** 주식 비중 게이지 한 줄 */
function WeightBar({ label, percent }: { label: string; percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex items-center gap-2">
      <span className="text-caption text-text-sub w-11 shrink-0">{label}</span>
      <div className="bg-surface h-1.5 flex-1 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-caption text-text-strong w-9 shrink-0 text-right font-semibold">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}
