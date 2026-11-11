import { formatKRW, formatManWon, formatSignedKRW } from "@/shared/lib/format";
import Image from "next/image";
import faceDown from "../assets/asset-face-down.svg";
import faceUp from "../assets/asset-face-up.svg";

export function AssetSummaryCard({
  title,
  totalAmount,
  monthlyChangeAmount,
  profitLossAmount = null,
}: {
  title: string;
  totalAmount: number;
  monthlyChangeAmount: number | null;
  profitLossAmount?: number | null;
}) {
  const change = monthlyChangeAmount ?? profitLossAmount;
  const face = change === null || change === 0 ? null : change > 0 ? faceUp : faceDown;

  return (
    <section className="rounded-card from-primary to-primary-light text-surface relative flex shrink-0 flex-col items-start gap-2.5 bg-linear-to-r px-[18px] py-5">
      {face && (
        <Image
          src={face}
          alt=""
          className={`pointer-events-none absolute right-[17px] h-auto w-[90px] ${
            face === faceUp ? "top-[23px]" : "top-[26px]"
          }`}
        />
      )}
      <h2 className="text-caption">{title}</h2>
      <p className="text-2xl font-bold">{formatKRW(totalAmount)}</p>

      {monthlyChangeAmount !== null && (
        <p className="bg-surface/20 text-caption inline-flex rounded-full px-2.5 py-1">
          {monthlyChangeAmount > 0 ? "▲ " : monthlyChangeAmount < 0 ? "▼ " : ""}
          {formatManWon(Math.abs(monthlyChangeAmount))} · 지난달 대비
        </p>
      )}

      {profitLossAmount !== null && (
        <p className="bg-surface/20 text-caption inline-flex rounded-full px-2.5 py-1">
          평가 손익 {formatSignedKRW(profitLossAmount)}
        </p>
      )}
    </section>
  );
}
