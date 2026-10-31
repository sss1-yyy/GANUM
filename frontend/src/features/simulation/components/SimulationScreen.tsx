"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ScreenFrame } from "@/components/layout/ScreenFrame";
import { isApiError } from "@/shared/api";
import { getUsage, remainingRuns } from "@/shared/api/endpoints";
import { sharedKeys } from "@/shared/api/query-keys";
import { LATEST_TRADING_DAY, runSimulations } from "../api";
import { EMPTY_DRAFT, toSimulationInput, type SimulationDraft } from "../draft";
import { KIND_ORDER } from "../labels";
import type { SimulationInput } from "../types";
import { SimulationInputView } from "./SimulationInputView";
import { SimulationResultView } from "./SimulationResultView";

export function SimulationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SimulationDraft>(EMPTY_DRAFT);
  const endDate = LATEST_TRADING_DAY;

  const usage = useQuery({
    queryKey: sharedKeys.usage,
    queryFn: async () => (await getUsage()).data,
  });

  const run = useMutation({
    mutationFn: () => {
      const inputs = KIND_ORDER.map((kind) => toSimulationInput(draft, kind, endDate));
      if (inputs.some((input) => input === null)) throw new Error("조건을 모두 골라 주세요.");
      return runSimulations(inputs as SimulationInput[]);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: sharedKeys.usage }),
  });

  return (
    <ScreenFrame className="gap-4">
      {run.isSuccess ? (
        <SimulationResultView
          simulations={run.data}
          draft={draft}
          onRetry={() => run.reset()}
          onFinish={() => router.push("/invest")}
        />
      ) : (
        <SimulationInputView
          draft={draft}
          onChange={setDraft}
          endDate={endDate}
          remaining={usage.data ? remainingRuns(usage.data, "SIMULATION") : null}
          isFreePlan={usage.data?.plan === "FREE"}
          running={run.isPending}
          error={run.error ? errorMessage(run.error) : null}
          onRun={() => run.mutate()}
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
