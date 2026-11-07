"use client";

import { useQuery } from "@tanstack/react-query";
import { getAssetHistory } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { formatKRW, formatMonthDay } from "@/shared/lib/format";
import { shiftDate } from "@/shared/lib/format-time";
import type { AssetHistoryPoint } from "@/shared/types";

export function AssetHistoryCard({ to }: { to: string }) {
  const from = shiftDate(to, -89);
  const history = useQuery({
    queryKey: sharedKeys.assetHistory(from, to),
    queryFn: async () => (await getAssetHistory(from, to)).data.items,
  });
  const points = history.data ?? [];

  return (
    <section className="rounded-card bg-surface shadow-card space-y-3 p-4">
      <h2 className="font-semibold">자산 추이</h2>
      <p className="text-caption text-text-sub">최근 90일 총자산</p>

      {history.isPending && <p role="status">자산 추이를 불러오고 있어요.</p>}

      {history.isError && (
        <div>
          <p role="alert" className="text-danger">
            자산 추이를 불러오지 못했어요.
          </p>
          <button type="button" onClick={() => void history.refetch()}>
            다시 시도하기
          </button>
        </div>
      )}

      {history.isSuccess && points.length === 0 && <p>표시할 자산 기록이 없어요.</p>}
      {points.length === 1 && (
        <p>
          {formatMonthDay(points[0].date)} 총자산 {formatKRW(points[0].totalAssets)}
        </p>
      )}
      {points.length > 1 && <HistoryPlot points={points} />}
    </section>
  );
}

function HistoryPlot({ points }: { points: AssetHistoryPoint[] }) {
  const first = points[0];
  const last = points[points.length - 1];
  const amounts = points.map((point) => point.totalAssets);
  const min = Math.min(...amounts);
  const range = Math.max(...amounts) - min;
  const start = Date.parse(first.date);
  const duration = Date.parse(last.date) - start || 1;

  const line = points
    .map((point) => {
      const x = 4 + ((Date.parse(point.date) - start) / duration) * 292;
      const y = range === 0 ? 50 : 94 - ((point.totalAssets - min) / range) * 88;

      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <figure>
      <svg aria-hidden="true" viewBox="0 0 300 100" className="text-primary block w-full">
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <figcaption className="text-caption text-text-sub flex justify-between gap-3">
        <span>
          {formatMonthDay(first.date)} · {formatKRW(first.totalAssets)}
        </span>
        <span className="text-right">
          {formatMonthDay(last.date)} · {formatKRW(last.totalAssets)}
        </span>
      </figcaption>
    </figure>
  );
}
