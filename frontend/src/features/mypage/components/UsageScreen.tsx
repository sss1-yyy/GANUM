"use client";

import { useQuery } from "@tanstack/react-query";
import { USE_MOCK } from "@/shared/api";
import { getUsage, remainingRuns } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { formatDotDate, formatNumber } from "@/shared/lib/format";
import { cardClass, InfoRow, LoadError, Loading, MypageScreen } from "./MypageScreen";

const features = [
  ["REPORT", "레포트"],
  ["SIMULATION", "시뮬레이션"],
  ["CHAT", "AI 질문"],
] as const;

export function UsageScreen() {
  const query = useQuery({ queryKey: sharedKeys.usage, queryFn: getUsage });
  const usage = query.data?.data;

  return (
    <MypageScreen title="이용 횟수" description="이용권과 기능별 남은 횟수를 확인해요.">
      {query.isPending && <Loading />}
      {query.isError && !usage && <LoadError onRetry={() => void query.refetch()} />}
      {usage && (
        <>
          <section className={cardClass} aria-labelledby="usage-summary">
            <h2 id="usage-summary" className="text-text-strong mb-2 font-semibold">
              {USE_MOCK ? "[예시] " : ""}내 이용권
            </h2>
            <dl className="divide-line divide-y">
              <InfoRow label="이용 플랜">
                {usage.plan === "PAID" ? "유료 플랜" : "무료 플랜"}
              </InfoRow>
              <InfoRow label="남은 이용권">{formatNumber(usage.tokenBalance)}개</InfoRow>
              {usage.resetsAt && (
                <InfoRow label="초기화 날짜">{formatDotDate(usage.resetsAt)}</InfoRow>
              )}
            </dl>
          </section>
          <section className={cardClass} aria-labelledby="usage-remaining">
            <h2 id="usage-remaining" className="text-text-strong mb-2 font-semibold">
              기능별 남은 이용 횟수
            </h2>
            <dl className="divide-line divide-y">
              {features.map(([feature, label]) => {
                const cost = usage.costs.find((item) => item.feature === feature)?.tokens;
                return (
                  <InfoRow key={feature} label={label}>
                    {cost && cost > 0
                      ? `${formatNumber(remainingRuns(usage, feature))}회`
                      : "확인할 수 없어요"}
                  </InfoRow>
                );
              })}
            </dl>
            <p className="text-text-sub mt-3 text-xs">
              같은 이용권을 함께 사용해서 한 기능을 이용하면 다른 기능의 남은 횟수도 달라질 수
              있어요.
            </p>
          </section>
        </>
      )}
    </MypageScreen>
  );
}
