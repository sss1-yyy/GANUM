"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { isApiError, POLL_INTERVAL_MS, type JobStatus } from "@/shared/api";
import { getUsage, remainingRuns } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { createSimulation, getSimulation, LATEST_TRADING_DAY, simulationKeys } from "../api";
import { EMPTY_DRAFT, toSimulationInput, type SimulationDraft } from "../draft";
import { KIND_ORDER } from "../labels";
import type { Simulation, SimulationKind } from "../types";
import { SimulationInputView } from "./SimulationInputView";
import { SimulationResultView } from "./SimulationResultView";

const isDone = (status: JobStatus | undefined) => status === "SUCCEEDED" || status === "FAILED";

type JobIds = Partial<Record<SimulationKind, string>>;

/**
 * 입력 → 실행 → 결과 흐름.
 * - 실행할 때의 조건(submitted)을 따로 보관해서, 실행 중에 입력을 바꿔도 결과는 실행한 조건으로 보여줘요.
 * - 만든 시뮬레이션 ID(jobIds)를 기억해서, 중간에 오류가 나면 다시 누를 때 새로 만들지 않고
 *   못 만든 것만 만들고 조회를 이어가요. (이용권이 두 번 차감되지 않도록)
 */
export function SimulationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SimulationDraft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState<SimulationDraft | null>(null);
  const [jobIds, setJobIds] = useState<JobIds>({});
  const endDate = LATEST_TRADING_DAY;

  const usage = useQuery({
    queryKey: sharedKeys.usage,
    queryFn: async () => (await getUsage()).data,
  });

  // SIM-01: 아직 만들지 못한 질문만 순서대로 요청 (첫 요청에서 이용권을 확인해요)
  const create = useMutation({
    mutationFn: async ({ snapshot, existing }: { snapshot: SimulationDraft; existing: JobIds }) => {
      const ids = { ...existing };
      for (const kind of KIND_ORDER) {
        if (ids[kind]) continue;
        const input = toSimulationInput(snapshot, kind, endDate);
        if (!input) throw new Error("조건을 모두 골라 주세요.");
        ids[kind] = (await createSimulation(input)).data.id;
        setJobIds({ ...ids });
      }
      return ids;
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: sharedKeys.usage }),
  });

  // SIM-03: 만든 시뮬레이션마다 SUCCEEDED/FAILED 가 될 때까지 반복 조회
  const polls = useQueries({
    queries: KIND_ORDER.map((kind) => {
      const id = jobIds[kind] ?? "";
      return {
        // 아직 만들기 전이면 질문별로 다른 자리 키를 써요 (빈 id 끼리 겹치지 않게)
        queryKey: id ? simulationKeys.detail(id) : ["simulations", "pending", kind],
        queryFn: async ({ signal }: { signal: AbortSignal }) =>
          (await getSimulation(id, signal)).data,
        enabled: Boolean(jobIds[kind]),
        refetchInterval: (query: { state: { data?: Simulation } }) =>
          isDone(query.state.data?.status) ? false : POLL_INTERVAL_MS,
      };
    }),
  });

  const allCreated = KIND_ORDER.every((kind) => jobIds[kind]);
  const results = polls.map((poll) => poll.data);
  const finished =
    submitted && allCreated && results.every((result) => isDone(result?.status))
      ? (results as Simulation[])
      : null;
  // 다시 조회하는 중에는 오류를 내리고 "돌리는 중"으로 보여줘요
  const pollError = polls.find((poll) => poll.isError && !poll.isFetching)?.error ?? null;
  const error = create.error ?? pollError;
  const running = Boolean(submitted) && !finished && !error;

  const run = () => {
    // 입력을 바꿨으면 처음부터, 그대로면 이어서 (만든 ID 는 다시 만들지 않아요)
    const resume = submitted === draft;
    const existing = resume ? jobIds : {};
    if (!resume) {
      setSubmitted(draft);
      setJobIds({});
    }
    polls.forEach((poll) => {
      if (resume && poll.isError) void poll.refetch();
    });
    if (!KIND_ORDER.every((kind) => existing[kind])) {
      create.mutate({ snapshot: draft, existing });
    }
  };

  const reset = () => {
    setSubmitted(null);
    setJobIds({});
    create.reset();
  };

  return (
    <ScreenFrame className="gap-4">
      {finished && submitted ? (
        <SimulationResultView
          simulations={finished}
          draft={submitted}
          onRetry={reset}
          onFinish={() => router.push("/invest")}
        />
      ) : (
        <SimulationInputView
          draft={draft}
          onChange={setDraft}
          endDate={endDate}
          remaining={usage.data ? remainingRuns(usage.data, "SIMULATION") : null}
          isFreePlan={usage.data?.plan === "FREE"}
          running={running}
          error={error ? errorMessage(error) : null}
          onRun={run}
        />
      )}
    </ScreenFrame>
  );
}

function errorMessage(error: Error): string {
  if (isApiError(error)) {
    return error.fields?.[0]?.message ?? error.message;
  }
  return error.message || "요청을 처리하지 못했어요.";
}
