import { formatKRW, formatSignedPercent } from "@/shared/lib/format";
import { maxDrawdownPercent } from "./drawdown";
import type { Scenario, SimulationKind } from "./types";

/**
 * 비교 카드 아래 두 줄 요약 (Figma 문구 형식).
 * focus = scenarios[0](만약·분산·적립식), base = scenarios[1](비교 대상)
 * 둘째 줄은 "더 번 쪽이 더 흔들렸는지"를 알려줘요. 할 말이 없으면 null.
 */
export function compareSummary(
  kind: SimulationKind,
  focus: Scenario,
  base: Scenario,
): [string, string | null] {
  const diff = focus.profitLoss - base.profitLoss;
  const amount = formatKRW(Math.abs(diff));
  const focusDrop = maxDrawdownPercent(focus.series);
  const baseDrop = maxDrawdownPercent(base.series);

  if (kind === "TIMING") {
    if (diff === 0) return ["그때 샀어도 수익은 같았을 거예요.", null];
    const first = `그때 샀다면 ${amount}을 ${diff > 0 ? "더" : "덜"} 벌었을 거예요.`;
    if (focusDrop >= 0) return [first, null];
    return [
      first,
      `${diff > 0 ? "하지만 " : ""}중간엔 ${formatSignedPercent(focusDrop)}까지 내려갔어요.`,
    ];
  }

  if (diff === 0) return ["두 방법의 수익이 같았어요.", null];
  const focusWins = diff > 0;
  const winnerDrop = focusWins ? focusDrop : baseDrop;
  const loserDrop = focusWins ? baseDrop : focusDrop;

  if (kind === "DIVERSIFICATION") {
    const [winner, loser] = focusWins ? ["분산", "집중"] : ["집중", "분산"];
    const first = `수익은 ${winner}이 ${amount} 더 컸어요.`;
    if (winnerDrop < loserDrop) return [first, `하지만 ${loser}이 덜 흔들렸어요.`];
    if (winnerDrop > loserDrop) return [first, `${winner}이 덜 흔들리기도 했어요.`];
    return [first, null];
  }

  // Figma: "한 번에 넣었다면 66,000원 더," / "하지만 더 크게 흔들렸어요."
  const lead = `${focusWins ? "매달 나눠 넣었다면" : "한 번에 넣었다면"} ${amount} 더`;
  if (winnerDrop < loserDrop) return [`${lead},`, "하지만 더 크게 흔들렸어요."];
  if (winnerDrop > loserDrop) return [`${lead},`, "흔들림도 더 적었어요."];
  return [`${lead} 벌었어요.`, null];
}
