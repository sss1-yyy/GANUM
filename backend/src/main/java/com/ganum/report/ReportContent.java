package com.ganum.report;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * 성공한 레포트의 본문 (REPORT-03 필드 구조 그대로).
 * summary 는 kind 에 따라 키가 다릅니다 — FINANCIAL: totalAssets, totalDebt, monthlyIncome, monthlyExpense,
 * monthlySurplus / PAPER: totalValue, profitLoss, returnPercent
 */
public record ReportContent(
		Map<String, Object> summary,
		List<Allocation> allocation,
		List<String> risks,
		List<String> priceChangeReasons,
		List<Advice> advice,
		List<Source> sources,
		List<String> limitations) {

	public record Allocation(String category, double weightPercent, String reason) {
	}

	public record Advice(String title, String description, List<String> considerations) {
	}

	public record Source(String title, String url, OffsetDateTime asOf) {
	}
}
