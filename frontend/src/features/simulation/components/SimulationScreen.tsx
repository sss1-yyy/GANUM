"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { ApiError, isApiError, POLL_INTERVAL_MS, type JobStatus } from "@/shared/api";
import { getUsage, remainingRuns } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { createSimulation, getSimulation, LATEST_TRADING_DAY, simulationKeys } from "../api";
import { EMPTY_DRAFT, isSameDraft, toSimulationInput, type SimulationDraft } from "../draft";
import { KIND_ORDER } from "../labels";
import type { Simulation, SimulationKind } from "../types";
import { SimulationInputView } from "./SimulationInputView";
import { SimulationResultView } from "./SimulationResultView";

const isDone = (status: JobStatus | undefined) => status === "SUCCEEDED" || status === "FAILED";

/** 이 시간 안에 끝나지 않으면 조회를 멈추고 다시 시도하게 해요 (pollUntilDone 과 같은 90초) */
const POLL_TIMEOUT_MS = 90_000;

type JobIds = Partial<Record<SimulationKind, string>>;

/**
 * 입력 → 실행 → 결과 흐름.
 * - 실행할 때의 조건(submitted)을 따로 보관해서, 실행 중에 입력을 바꿔도 결과는 실행한 조건으로 보여줘요.
 * - 만든 시뮬레이션 ID(jobIds)를 기억해서, 중간에 오류가 나면 다시 누를 때 새로 만들지 않고
 *   못 만든 것만 만들고 조회를 이어가요. (이용권이 두 번 차감되지 않도록)
 * - 조회 오류·시간 초과가 나면 반복 조회를 멈추고, "다시 시도하기"로 다시 시작해요.
 */
export function SimulationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SimulationDraft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState<SimulationDraft | null>(null);
  const [jobIds, setJobIds] = useState<JobIds>({});
  const [resultIndex, setResultIndex] = useState(0);
  /** 결과를 보는 중인지. 결과 1에서 뒤로 가도 결과는 지우지 않고 화면만 입력으로 바꿔요 */
  const [showResults, setShowResults] = useState(false);
  /** 이번 실행(또는 다시 시도)을 시작한 시각. 시간 초과 판단용 */
  const startedAt = useRef(0);
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
        queryFn: async ({ signal }: { signal: AbortSignal }) => {
          const simulation = (await getSimulation(id, signal)).data;
          if (!isDone(simulation.status) && Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
            throw new ApiError(
              0,
              "POLL_TIMEOUT",
              "처리 시간이 너무 오래 걸려요. 잠시 후 다시 시도해 주세요.",
            );
          }
          return simulation;
        },
        enabled: Boolean(jobIds[kind]),
        // 끝났거나 오류가 나면 멈춰요. 오류는 "다시 시도하기"에서 refetch 로 다시 시작해요
        refetchInterval: (query: { state: { data?: Simulation; status: string } }) =>
          query.state.status === "error" || isDone(query.state.data?.status)
            ? false
            : POLL_INTERVAL_MS,
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
  const error = create.isPending ? null : (create.error ?? pollError);
  // 생성 요청이 도는 중에는 조회 오류가 나도 "돌리는 중"으로 두어 버튼이 눌리지 않게 해요 (요청 중복 방지)
  const running = create.isPending || (Boolean(submitted) && !finished && !error);
  // 같은 조건(값 비교)으로 실행했다가 오류로 멈췄고, 이미 만든 시뮬레이션이 있으면 이어서 해요
  const sameAsSubmitted = submitted !== null && isSameDraft(submitted, draft);
  const canResume = Boolean(error) && sameAsSubmitted && KIND_ORDER.some((kind) => jobIds[kind]);
  // 결과가 있는데 조건을 바꾸지 않았으면 이용권 없이 결과를 다시 볼 수 있어요
  const canViewResults = Boolean(finished) && sameAsSubmitted;

  const run = () => {
    if (create.isPending) return;
    setShowResults(true);
    // 이미 끝난 결과를 다시 보는 경우: 새로 만들거나 조회하지 않아요
    if (canViewResults) return;
    startedAt.current = Date.now();
    // 입력을 바꿨으면 처음부터, 그대로면 이어서 (만든 ID 는 다시 만들지 않아요)
    const resume = sameAsSubmitted;
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
    setResultIndex(0);
    setShowResults(false);
    setSubmitted(null);
    setJobIds({});
    create.reset();
  };

  return (
    <ScreenFrame
      className="gap-4"
      // 결과 화면: 이전 결과로, 첫 결과면 입력 화면으로 (결과는 남겨 둬요). 입력 화면은 이전 페이지로
      onBack={
        showResults && finished
          ? () => {
              if (resultIndex > 0) setResultIndex(resultIndex - 1);
              else setShowResults(false);
              document.querySelector("main")?.scrollTo({ top: 0 });
            }
          : undefined
      }
    >
      {showResults && finished && submitted ? (
        <SimulationResultView
          simulations={finished}
          draft={submitted}
          index={resultIndex}
          onIndexChange={setResultIndex}
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
          canResume={canResume}
          canViewResults={canViewResults}
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
