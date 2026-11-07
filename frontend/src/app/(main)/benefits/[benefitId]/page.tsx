// 담당: D · 화면: 혜택 상세
// 사용할 API: BENEFIT-02 (docs/mock-guide.md 참고)
// 이 파일에 화면을 구현하세요. 큰 화면은 src/features/<기능>/components/ 에 만들고 여기서 불러옵니다.
import { BenefitDetailScreen } from "@/features/benefits/components/BenefitDetailScreen";

export default async function Page({ params }: PageProps<"/benefits/[benefitId]">) {
  const { benefitId } = await params;
  return <BenefitDetailScreen key={benefitId} benefitId={benefitId} />;
}
