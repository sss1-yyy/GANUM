// 담당: B · 화면: 종목 상세
// 사용할 API: MARKET-02, MARKET-03 (docs/mock-guide.md 참고)
import { InstrumentDetailScreen } from "@/features/invest/components/InstrumentDetailScreen";

export default async function Page({ params }: PageProps<"/invest/[instrumentId]">) {
  const { instrumentId } = await params;
  return <InstrumentDetailScreen instrumentId={instrumentId} />;
}
