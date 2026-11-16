package com.ganum.chat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.ganum.benefit.BenefitRepository;
import com.ganum.chat.ChatSession.ContextType;
import com.ganum.common.error.ApiException;
import com.ganum.common.error.ErrorCode;
import com.ganum.common.time.Times;
import com.ganum.market.Instrument;
import com.ganum.market.InstrumentRepository;
import com.ganum.market.MarketService;
import com.ganum.report.Report;
import com.ganum.report.ReportContent;
import com.ganum.report.ReportFacts;
import com.ganum.report.ReportFactsBuilder;
import com.ganum.report.ReportService;

/** 화면 종류별로 챗봇이 참고할 맥락을 모읍니다. 본인 데이터만 읽습니다. */
@Component
@Transactional(readOnly = true)
class ChatContextLoader {

	/** 화면별 대화 제목·추천 질문 (프론트 목데이터와 같은 문구) */
	static final Map<ContextType, String> TITLES = Map.of(
			ContextType.HOME, "궁금한 금융 이야기",
			ContextType.ASSET, "내 자산",
			ContextType.BENEFIT, "청년 혜택",
			ContextType.REPORT, "내 레포트",
			ContextType.INSTRUMENT, "종목 설명",
			ContextType.SIMULATION, "시뮬레이션 결과");

	static final Map<ContextType, List<String>> SUGGESTIONS = Map.of(
			ContextType.HOME, List.of("내 적금은?", "예시로 설명", "더 쉽게"),
			ContextType.ASSET, List.of("어디에 많이 있어요?", "비중이 괜찮나요?", "더 쉽게"),
			ContextType.BENEFIT, List.of("5년 뒤 얼마 받아?", "가입할 수 있을까?", "중도 해지하면?"),
			ContextType.REPORT, List.of("뭐부터 해요?", "비상금은 얼마나?", "월세 지원 신청법"),
			ContextType.INSTRUMENT, List.of("어떤 회사예요?", "위험한가요?", "얼마부터 시작해요?"),
			ContextType.SIMULATION, List.of("왜 이런 결과가 나왔어요?", "분산하면 달라져요?", "더 쉽게"));

	private final ReportFactsBuilder factsBuilder;
	private final ReportService reportService;
	private final InstrumentRepository instrumentRepository;
	private final BenefitRepository benefitRepository;

	ChatContextLoader(ReportFactsBuilder factsBuilder, ReportService reportService,
			InstrumentRepository instrumentRepository, BenefitRepository benefitRepository) {
		this.factsBuilder = factsBuilder;
		this.reportService = reportService;
		this.instrumentRepository = instrumentRepository;
		this.benefitRepository = benefitRepository;
	}

	/** 대화 생성 시 리소스 접근 권한 확인 + 표시 제목. 본인 레포트·존재하는 종목이 아니면 404 */
	String verifyAndTitle(Long userId, ContextType type, String contextId) {
		return switch (type) {
			case REPORT -> {
				reportService.findOwned(userId, contextId)
						.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "레포트를 찾을 수 없어요."));
				yield TITLES.get(type);
			}
			case INSTRUMENT -> instrumentRepository.findById(contextId)
					.map(Instrument::getName)
					.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "종목을 찾을 수 없어요."));
			default -> TITLES.get(type);
		};
	}

	ChatContext load(Long userId, ChatSession session) {
		return switch (session.getContextType()) {
			case HOME, ASSET -> assets(userId, session.getContextType());
			case REPORT -> report(userId, session.getContextId());
			case INSTRUMENT -> instrument(session.getContextId());
			case BENEFIT -> benefit(session.getContextId());
			case SIMULATION -> new ChatContext("과거 투자 시뮬레이션 결과 화면 (목데이터 영역이라 서버에 결과 수치가 없음)",
					List.of(), List.of(),
					"[예시] 선택한 기간의 실제 가격 흐름으로 계산한 결과예요. 앞으로의 수익을 보장하지 않아요.",
					"그때 샀다면 이랬을 거라는 계산일 뿐, 미래를 알려주는 건 아니에요.");
		};
	}

	private ChatContext assets(Long userId, ContextType type) {
		ReportFacts f = factsBuilder.build(userId, Report.Kind.FINANCIAL);
		String top = f.allocation().isEmpty() ? "자산" : f.allocation().getFirst().label();
		return new ChatContext(type == ContextType.HOME ? "홈 화면 (사용자의 재정·자산 요약)" : "내 자산 화면",
				f.facts(), f.sources(),
				"[예시] %s 비중이 가장 커요. 한 곳에 몰려 있지는 않은지 비중을 함께 살펴보세요.".formatted(top),
				"돈이 어디에 얼마나 나뉘어 있는지 보는 거예요.");
	}

	private ChatContext report(Long userId, String reportId) {
		Report r = reportService.findOwned(userId, reportId)
				.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "레포트를 찾을 수 없어요."));
		List<String> facts = new ArrayList<>();
		List<ReportContent.Source> sources = new ArrayList<>();
		reportService.contentOf(r).ifPresentOrElse(c -> {
			c.summary().forEach((k, v) -> facts.add("summary." + k + " = " + v));
			c.allocation().forEach(a -> facts.add("배분 %s %.1f%%: %s".formatted(a.category(), a.weightPercent(), a.reason())));
			c.advice().forEach(a -> facts.add("조언: %s — %s".formatted(a.title(), a.description())));
			c.risks().forEach(x -> facts.add("위험: " + x));
			sources.add(new ReportContent.Source("내 레포트 (" + r.getKind().name() + ")", null, Times.toKst(r.getCreatedAt())));
			sources.addAll(c.sources());
		}, () -> facts.add("레포트가 아직 완성되지 않았어요 (상태: " + r.getStatus().name() + ")"));
		return new ChatContext("레포트 상세 화면", facts, sources,
				"[예시] 비상금을 먼저 채운 뒤 장기 저축을 시작하는 순서를 고려해 볼 수 있어요. 월 여유금 안에서 나눠 담아 보세요.",
				"급할 때 쓸 돈부터 만들고, 그다음에 오래 묶어둘 돈을 모으는 거예요.");
	}

	private ChatContext instrument(String instrumentId) {
		Instrument i = instrumentRepository.findById(instrumentId)
				.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "종목을 찾을 수 없어요."));
		var meta = MarketService.metaOf(List.of(i));
		List<String> facts = List.of(
				"종목 %s(%s), 유형 %s, 시장 %s".formatted(i.getName(), i.getSymbol(), i.getType(), i.getMarket()),
				"기준가 %,d원, 직전 종가 대비 %+,d원 (%s%%)".formatted(i.getPrice(), i.getChangeAmount(), i.getChangePercent()),
				"시세 기준일 %s, 출처 %s".formatted(i.getQuoteDate(), meta.source()));
		return new ChatContext("종목 상세 화면", facts,
				List.of(new ReportContent.Source(i.getName() + " 시세", null, meta.asOf())),
				"[예시] %s은(는) 가격 변동이 있을 수 있어요. 한 번에 큰 금액을 넣기보다 나눠서 시작하는 방법이 있어요.".formatted(i.getName()),
				"주가가 오르내릴 수 있으니 작게 시작해 보라는 뜻이에요.");
	}

	private ChatContext benefit(String benefitId) {
		List<String> facts = new ArrayList<>();
		benefitRepository.findById(benefitId).ifPresent(b -> facts.add("혜택 %s, 신청 마감 %s".formatted(b.getTitle(),
				b.getDeadline() == null ? "상시" : b.getDeadline())));
		return new ChatContext("청년 혜택 화면 (최종 자격은 공식 안내에서 확인 필요)", facts, List.of(),
				"[예시] 신청 조건과 마감일은 공식 안내에서 한 번 더 확인해 주세요.",
				"내 조건이 맞는지 확인하고, 마감 전에 신청하면 돼요.");
	}
}
