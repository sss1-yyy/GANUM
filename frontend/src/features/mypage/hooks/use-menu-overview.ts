"use client";

import { useQuery } from "@tanstack/react-query";
import { getLatestInvestmentProfile, getMe, getUsage } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";

/** USER-01 · PROFILE-03 · USAGE-01의 기존 API와 공통 캐시를 재사용해요. */
export function useMenuOverview() {
  const user = useQuery({
    queryKey: sharedKeys.me,
    queryFn: async () => (await getMe()).data,
  });
  const profile = useQuery({
    queryKey: sharedKeys.latestProfile,
    queryFn: async () => (await getLatestInvestmentProfile()).data,
  });
  const usage = useQuery({
    queryKey: sharedKeys.usage,
    queryFn: async () => (await getUsage()).data,
  });
  return { user, profile, usage };
}
