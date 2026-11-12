package com.ganum.report;

import java.util.List;
import java.util.Map;

/** 서버가 계산한 사실(ReportFacts)을 바탕으로 설명 문장을 씁니다. */
interface ReportWriter {

	Written write(ReportFacts facts);

	/**
	 * @param allocationReasons 카테고리 → 비중 설명
	 * @param aiTokens AI 사용 토큰 수 (템플릿이면 null)
	 */
	record Written(Map<String, String> allocationReasons, List<String> risks, List<ReportContent.Advice> advice,
			List<String> extraLimitations, Integer aiTokens) {
	}
}
