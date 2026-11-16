package com.ganum.report;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import com.ganum.common.api.Meta;

/**
 * 서버가 계산한 레포트 입력값. AI 에는 이 값만 주고, 숫자를 새로 만들지 못하게 합니다.
 *
 * @param summary 응답 summary 그대로
 * @param allocation 현재 자산 배분 (카테고리 → 비중 %), 금액 큰 순
 * @param facts AI·템플릿이 문장에 쓸 수 있는 확인된 사실들 (사람이 읽는 문장)
 * @param sources 사용한 자료
 * @param limitations 서버가 아는 한계 (항상 포함)
 * @param meta 데이터 출처·기준 시각
 */
public record ReportFacts(
		Report.Kind kind,
		Map<String, Object> summary,
		List<Slice> allocation,
		List<String> facts,
		List<ReportContent.Source> sources,
		List<String> limitations,
		Meta meta) {

	/** 배분 한 칸. amount 는 원 */
	public record Slice(String category, String label, long amount, double weightPercent) {
	}

	public OffsetDateTime asOf() {
		return meta.asOf();
	}
}
