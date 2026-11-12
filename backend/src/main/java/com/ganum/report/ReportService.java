package com.ganum.report;

import java.time.Clock;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.core.task.TaskExecutor;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.ganum.common.api.KeysetCursor;
import com.ganum.common.api.ListData;
import com.ganum.common.api.Meta;
import com.ganum.common.api.OffsetCursor;
import com.ganum.common.error.ApiException;
import com.ganum.common.error.ErrorCode;
import com.ganum.common.time.Times;
import com.ganum.report.dto.ReportDtos;
import com.ganum.usage.UsageFeature;
import com.ganum.usage.UsageService;
import com.ganum.user.FinancialProfile;
import com.ganum.user.FinancialProfileRepository;

import tools.jackson.databind.ObjectMapper;

@Service
public class ReportService {

	private final ReportRepository reportRepository;
	private final FinancialProfileRepository financialProfileRepository;
	private final UsageService usageService;
	private final ReportGenerator generator;
	private final TaskExecutor aiTaskExecutor;
	private final ObjectMapper objectMapper;
	private final Clock clock;

	public ReportService(ReportRepository reportRepository, FinancialProfileRepository financialProfileRepository,
			UsageService usageService, ReportGenerator generator, TaskExecutor aiTaskExecutor,
			ObjectMapper objectMapper, Clock clock) {
		this.reportRepository = reportRepository;
		this.financialProfileRepository = financialProfileRepository;
		this.usageService = usageService;
		this.generator = generator;
		this.aiTaskExecutor = aiTaskExecutor;
		this.objectMapper = objectMapper;
		this.clock = clock;
	}

	/** REPORT-01 · 토큰 차감 후 QUEUED 로 저장하고, 커밋 뒤 백그라운드에서 생성 */
	@Transactional
	public ReportDtos.Created create(Long userId, String kindText) {
		Report.Kind kind = parseKind(kindText);
		if (kind == Report.Kind.FINANCIAL) {
			boolean ready = financialProfileRepository.findById(userId)
					.map(FinancialProfile::isOnboardingCompleted).orElse(false);
			if (!ready) {
				throw new ApiException(ErrorCode.PROFILE_INCOMPLETE);
			}
		}
		int charged = usageService.charge(userId, UsageFeature.REPORT);
		Report report = reportRepository.save(new Report(userId, kind, charged, clock.instant()));
		Long id = report.getId();
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				aiTaskExecutor.execute(() -> generator.generate(id));
			}
		});
		return new ReportDtos.Created(String.valueOf(id), report.getStatus().name());
	}

	/** REPORT-02 · 최신순, 같은 시각이면 id 내림차순 */
	@Transactional(readOnly = true)
	public ListData<ReportDtos.Item> list(Long userId, String cursor, Integer limit) {
		int size = OffsetCursor.limit(limit);
		KeysetCursor after = KeysetCursor.decode(cursor);
		List<Report> rows = reportRepository.findPage(userId, after == null ? null : after.createdAt(),
				after == null ? null : after.id(), Limit.of(size + 1));
		boolean hasNext = rows.size() > size;
		List<Report> page = hasNext ? rows.subList(0, size) : rows;
		String next = hasNext ? new KeysetCursor(page.getLast().getCreatedAt(), page.getLast().getId()).encode() : null;
		return ListData.of(page.stream().map(this::toItem).toList(), next);
	}

	/** REPORT-03 · 본인 레포트가 아니면 404. 실패해도 200 + status=FAILED */
	@Transactional(readOnly = true)
	public Result detail(Long userId, String reportId) {
		Report r = find(userId, reportId);
		Optional<ReportContent> content = contentOf(r);
		ReportDtos.Detail detail = new ReportDtos.Detail(
				String.valueOf(r.getId()), r.getKind().name(), r.getStatus().name(),
				content.map(ReportContent::summary).orElse(null),
				content.map(ReportContent::allocation).orElse(List.of()),
				content.map(ReportContent::risks).orElse(List.of()),
				content.map(ReportContent::priceChangeReasons).orElse(List.of()),
				content.map(ReportContent::advice).orElse(List.of()),
				content.map(ReportContent::sources).orElse(List.of()),
				content.map(ReportContent::limitations).orElse(List.of()),
				r.getErrorCode(), Times.toKst(r.getCreatedAt()));
		Meta meta = r.getDataSource() == null ? null : new Meta(r.getDataSource(), Times.toKst(r.getDataAsOf()));
		return new Result(detail, meta);
	}

	/** 챗봇이 레포트 맥락을 읽을 때 사용 */
	@Transactional(readOnly = true)
	public Optional<Report> findOwned(Long userId, String reportId) {
		return parseId(reportId).flatMap(id -> reportRepository.findByIdAndUserId(id, userId));
	}

	public Optional<ReportContent> contentOf(Report r) {
		if (r.getStatus() != Report.Status.SUCCEEDED || r.getContentJson() == null) {
			return Optional.empty();
		}
		return Optional.of(objectMapper.readValue(r.getContentJson(), ReportContent.class));
	}

	private ReportDtos.Item toItem(Report r) {
		List<String> headlines = contentOf(r)
				.map(c -> c.advice().stream().map(ReportContent.Advice::title).filter(t -> !t.isBlank()).limit(3).toList())
				.orElse(List.of());
		return new ReportDtos.Item(String.valueOf(r.getId()), r.getKind().name(), r.getStatus().name(),
				Times.toKst(r.getCreatedAt()), headlines);
	}

	private Report find(Long userId, String reportId) {
		return findOwned(userId, reportId)
				.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "레포트를 찾을 수 없어요."));
	}

	private static Report.Kind parseKind(String text) {
		if (text == null) {
			throw ApiException.validation("kind", "필수 값이에요.");
		}
		try {
			return Report.Kind.valueOf(text.toUpperCase(Locale.ROOT));
		}
		catch (IllegalArgumentException e) {
			throw ApiException.validation("kind", "FINANCIAL 또는 PAPER 여야 해요.");
		}
	}

	private static Optional<Long> parseId(String id) {
		try {
			return Optional.of(Long.parseLong(id));
		}
		catch (NumberFormatException e) {
			return Optional.empty();
		}
	}

	public record Result(ReportDtos.Detail data, Meta meta) {
	}
}
