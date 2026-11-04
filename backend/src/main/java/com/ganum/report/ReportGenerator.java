package com.ganum.report;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import com.ganum.ai.AiException;
import com.ganum.ai.GeminiClient;
import com.ganum.notification.Notification;
import com.ganum.notification.NotificationService;
import com.ganum.usage.UsageService;

import tools.jackson.databind.ObjectMapper;

/**
 * 레포트 1건을 실제로 만드는 백그라운드 작업.
 * 실패하면 FAILED + errorCode 로 남기고 차감한 토큰을 돌려줍니다. 성공하면 REPORT_READY 알림을 보냅니다.
 */
@Component
class ReportGenerator {

	private static final Logger log = LoggerFactory.getLogger(ReportGenerator.class);

	private final ReportRepository reportRepository;
	private final ReportFactsBuilder factsBuilder;
	private final GeminiClient gemini;
	private final GeminiReportWriter geminiWriter;
	private final TemplateReportWriter templateWriter;
	private final UsageService usageService;
	private final NotificationService notificationService;
	private final ObjectMapper objectMapper;
	private final TransactionTemplate tx;
	private final Clock clock;

	ReportGenerator(ReportRepository reportRepository, ReportFactsBuilder factsBuilder, GeminiClient gemini,
			GeminiReportWriter geminiWriter, TemplateReportWriter templateWriter, UsageService usageService,
			NotificationService notificationService, ObjectMapper objectMapper, TransactionTemplate tx, Clock clock) {
		this.reportRepository = reportRepository;
		this.factsBuilder = factsBuilder;
		this.gemini = gemini;
		this.geminiWriter = geminiWriter;
		this.templateWriter = templateWriter;
		this.usageService = usageService;
		this.notificationService = notificationService;
		this.objectMapper = objectMapper;
		this.tx = tx;
		this.clock = clock;
	}

	void generate(Long reportId) {
		Report report = tx.execute(s -> {
			Report r = reportRepository.findById(reportId).orElseThrow();
			r.start();
			return r;
		});
		try {
			ReportFacts facts = factsBuilder.build(report.getUserId(), report.getKind());
			ReportWriter writer = gemini.enabled() ? geminiWriter : templateWriter;
			ReportWriter.Written written = writer.write(facts);

			List<ReportContent.Allocation> allocation = facts.allocation().stream()
					.map(s -> new ReportContent.Allocation(s.category(), s.weightPercent(),
							written.allocationReasons().getOrDefault(s.category(), "")))
					.toList();
			List<String> limitations = new ArrayList<>(facts.limitations());
			limitations.addAll(written.extraLimitations());
			ReportContent content = new ReportContent(facts.summary(), allocation, written.risks(), List.of(),
					written.advice(), facts.sources(), limitations);
			String json = objectMapper.writeValueAsString(content);
			Instant asOf = facts.asOf() == null ? null : facts.asOf().toInstant();

			tx.executeWithoutResult(s -> {
				Report r = reportRepository.findById(reportId).orElseThrow();
				r.succeed(json, written.aiTokens(), facts.meta().source(), asOf, clock.instant());
				notificationService.publish(r.getUserId(), Notification.Type.REPORT_READY,
						r.getKind() == Report.Kind.FINANCIAL ? "재정 레포트가 준비됐어요" : "모의투자 레포트가 준비됐어요",
						"새 레포트에서 자산 배분과 조언을 확인해 보세요.",
						Notification.TargetType.REPORT, String.valueOf(r.getId()), "REPORT:" + r.getId());
			});
		}
		catch (AiException e) {
			fail(report, e.code().name());
		}
		catch (Exception e) {
			log.error("레포트 생성 실패 (id={})", reportId, e);
			fail(report, "INTERNAL_ERROR");
		}
	}

	void fail(Report report, String errorCode) {
		tx.executeWithoutResult(s -> {
			Report r = reportRepository.findById(report.getId()).orElseThrow();
			if (r.isFinished()) {
				return;
			}
			r.fail(errorCode, clock.instant());
			usageService.refund(r.getUserId(), r.getTokensCharged());
		});
		log.warn("레포트 FAILED (id={}, code={}) — 토큰 환불", report.getId(), errorCode);
	}
}
