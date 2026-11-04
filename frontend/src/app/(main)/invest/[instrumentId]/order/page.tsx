// 담당: B · 화면: 매수/매도 (?side=BUY|SELL)
// 사용할 API: PAPER-03, PAPER-04 (docs/mock-guide.md 참고)
import { OrderScreen } from "@/features/invest/components/OrderScreen";

export default async function Page({
  params,
  searchParams,
}: PageProps<"/invest/[instrumentId]/order">) {
  const { instrumentId } = await params;
  const { side } = await searchParams;
  return <OrderScreen instrumentId={instrumentId} side={side === "SELL" ? "SELL" : "BUY"} />;
}
