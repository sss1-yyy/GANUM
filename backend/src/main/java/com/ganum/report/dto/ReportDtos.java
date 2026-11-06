package com.ganum.report.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import com.ganum.report.ReportContent;

/** REPORT-01·02·03 요청/응답 */
public final class ReportDtos {

	private ReportDtos() {
	}

	/** REPORT-01 요청. kind 는 FINANCIAL / PAPER (문자열로 받아 422 로 검증) */
	public record CreateRequest(String kind) {
	}

	/** REPORT-01 응답 */
	public record Created(String id, String status) {
	}

	/** REPORT-02 목록 항목 */
	public record Item(String id, String kind, String status, OffsetDateTime createdAt, List<String> headlines) {
	}

	/** REPORT-03 상세 */
	public record Detail(
			String id,
			String kind,
			String status,
			Map<String, Object> summary,
			List<ReportContent.Allocation> allocation,
			List<String> risks,
			List<String> priceChangeReasons,
			List<ReportContent.Advice> advice,
			List<ReportContent.Source> sources,
			List<String> limitations,
			String errorCode,
			OffsetDateTime createdAt) {
	}
}
