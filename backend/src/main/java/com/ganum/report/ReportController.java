package com.ganum.report;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ganum.common.api.ApiResponse;
import com.ganum.common.api.ListData;
import com.ganum.common.auth.CurrentUserId;
import com.ganum.report.dto.ReportDtos;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

	private final ReportService reportService;

	public ReportController(ReportService reportService) {
		this.reportService = reportService;
	}

	/** REPORT-01 · 레포트 생성 (202 → REPORT-03 반복 조회) */
	@PostMapping
	@ResponseStatus(HttpStatus.ACCEPTED)
	public ApiResponse<ReportDtos.Created> create(@CurrentUserId Long userId,
			@RequestBody ReportDtos.CreateRequest request) {
		return ApiResponse.of(reportService.create(userId, request.kind()));
	}

	/** REPORT-02 · 이전 레포트 목록 */
	@GetMapping
	public ApiResponse<ListData<ReportDtos.Item>> list(@CurrentUserId Long userId,
			@RequestParam(required = false) String cursor, @RequestParam(required = false) Integer limit) {
		return ApiResponse.of(reportService.list(userId, cursor, limit));
	}

	/** REPORT-03 · 레포트 상세·생성 상태 */
	@GetMapping("/{reportId}")
	public ApiResponse<ReportDtos.Detail> detail(@CurrentUserId Long userId, @PathVariable String reportId) {
		var result = reportService.detail(userId, reportId);
		return ApiResponse.of(result.data(), result.meta());
	}
}
