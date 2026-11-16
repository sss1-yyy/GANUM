package com.ganum.report;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

/**
 * AI 키가 없을 때 쓰는 규칙 기반 문장. 숫자는 모두 서버 계산값만 사용합니다.
 */
@Component
class TemplateReportWriter implements ReportWriter {

	@Override
	public Written write(ReportFacts facts) {
		Map<String, String> reasons = new LinkedHashMap<>();
		for (ReportFacts.Slice s : facts.allocation()) {
			reasons.put(s.category(), reason(s));
		}
		List<String> risks = new ArrayList<>();
		List<ReportContent.Advice> advice = new ArrayList<>();
		if (facts.kind() == Report.Kind.FINANCIAL) {
			Object surplus = facts.summary().get("monthlySurplus");
			if (surplus instanceof Long s) {
				advice.add(new ReportContent.Advice("월 여유금을 점검해 보세요.",
						"입력값 기준 월 여유금은 %s이에요.".formatted(ReportFactsBuilder.won(s)),
						List.of("예상하지 못한 지출과 부채 상환을 함께 고려하세요.")));
			}
			advice.add(new ReportContent.Advice("비상금 목표를 확인해 보세요.",
					"급하게 쓸 돈은 바로 꺼낼 수 있는 곳에 따로 두는 방법이 있어요.",
					List.of("일반적으로 월 지출의 몇 개월분을 기준으로 삼아요.", "개인 상황에 따라 필요한 금액이 달라요.")));
			advice.add(new ReportContent.Advice("자산 비중을 살펴보세요.",
					"한 곳에 몰려 있는 자산이 있는지 비중을 함께 확인해 보세요.",
					List.of("투자자산은 가격이 내려갈 수 있어요.")));
			facts.allocation().stream().filter(s -> s.category().equals("CRYPTO") && s.weightPercent() >= 5)
					.findFirst().ifPresent(s -> risks.add("코인 비중이 %.1f%%예요. 코인은 가격 변동이 커서 손실이 날 수 있어요."
							.formatted(s.weightPercent())));
			risks.add("주식·ETF 는 시세에 따라 평가금액이 내려갈 수 있어요.");
		}
		else {
			advice.add(new ReportContent.Advice("종목별 비중을 살펴보세요.",
					"가상 현금과 보유 종목의 비중을 확인해 보세요.",
					List.of("모의투자 결과는 실제 투자 결과와 다를 수 있어요.")));
			advice.add(new ReportContent.Advice("손익 흐름을 기록해 보세요.",
					"매수·매도 이유를 함께 적어두면 다음 판단에 도움이 돼요.",
					List.of("과거 결과이며 앞으로를 보장하지 않아요.")));
			risks.add("보유 종목의 가격이 내려가면 평가금액이 줄어들 수 있어요.");
		}
		return new Written(reasons, risks, advice, List.of("[예시] AI 대신 규칙 기반 문장으로 작성했어요."), null);
	}

	private static String reason(ReportFacts.Slice s) {
		return switch (s.category()) {
			case "CASH" -> "바로 쓸 수 있는 돈이에요. 생활비와 비상 상황에 대비하는 역할을 해요.";
			case "DEPOSIT" -> "원금이 비교적 안정적이지만 중도 해지 시 이자가 줄 수 있어요.";
			case "STOCK", "ETF" -> "시세에 따라 가치가 오르내리는 투자자산이에요.";
			case "CRYPTO" -> "가격 변동이 매우 큰 자산이에요.";
			default -> "기타 자산이에요.";
		};
	}
}
