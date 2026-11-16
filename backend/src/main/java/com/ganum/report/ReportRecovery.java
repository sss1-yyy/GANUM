package com.ganum.report;

import java.util.List;

import org.springframework.stereotype.Component;

/** 서버가 생성 도중 꺼졌다면 남아 있는 QUEUED/RUNNING 레포트를 FAILED(INTERRUPTED) 로 정리하고 환불합니다. */
@Component
public class ReportRecovery {

	private final ReportRepository reportRepository;
	private final ReportGenerator generator;

	ReportRecovery(ReportRepository reportRepository, ReportGenerator generator) {
		this.reportRepository = reportRepository;
		this.generator = generator;
	}

	public void recover() {
		reportRepository.findByStatusIn(List.of(Report.Status.QUEUED, Report.Status.RUNNING))
				.forEach(r -> generator.fail(r, "INTERRUPTED"));
	}
}
