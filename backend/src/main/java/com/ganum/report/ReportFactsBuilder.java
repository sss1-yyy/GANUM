package com.ganum.report;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.ganum.asset.AssetCategory;
import com.ganum.asset.AssetValuationService;
import com.ganum.asset.AssetValuationService.PricedHolding;
import com.ganum.common.Numbers;
import com.ganum.common.api.Meta;
import com.ganum.common.time.Times;
import com.ganum.market.Instrument;
import com.ganum.market.InstrumentRepository;
import com.ganum.market.MarketService;
import com.ganum.user.FinancialProfile;
import com.ganum.user.FinancialProfileRepository;

/** 레포트에 들어갈 숫자와 사실을 서버에서 계산합니다. (계산은 서버, AI 는 설명만) */
@Component
@Transactional(readOnly = true)
public class ReportFactsBuilder {

	static final Map<String, String> LABELS = Map.of(
			"CASH", "입출금", "DEPOSIT", "예적금", "STOCK", "주식", "ETF", "ETF", "CRYPTO", "코인", "OTHER", "기타");

	private final AssetValuationService valuationService;
	private final FinancialProfileRepository financialProfileRepository;
	private final InstrumentRepository instrumentRepository;

	public ReportFactsBuilder(AssetValuationService valuationService,
			FinancialProfileRepository financialProfileRepository, InstrumentRepository instrumentRepository) {
		this.valuationService = valuationService;
		this.financialProfileRepository = financialProfileRepository;
		this.instrumentRepository = instrumentRepository;
	}

	public ReportFacts build(Long userId, Report.Kind kind) {
		return kind == Report.Kind.FINANCIAL ? financial(userId) : paper();
	}

	private ReportFacts financial(Long userId) {
		var v = valuationService.valuate(userId);
		FinancialProfile p = financialProfileRepository.findById(userId).orElse(null);
		Long income = p == null ? null : p.getMonthlyIncome();
		Long expense = p == null ? null : p.getMonthlyExpense();
		Long surplus = income != null && expense != null ? income - expense : null;

		Map<String, Object> summary = new LinkedHashMap<>();
		summary.put("totalAssets", v.totalAssets());
		summary.put("totalDebt", v.totalDebt());
		summary.put("monthlyIncome", income);
		summary.put("monthlyExpense", expense);
		summary.put("monthlySurplus", surplus);

		List<ReportFacts.Slice> slices = v.byCategory().entrySet().stream()
				.filter(e -> e.getValue() > 0)
				.map(e -> new ReportFacts.Slice(e.getKey().name(), LABELS.get(e.getKey().name()), e.getValue(),
						Numbers.weight(e.getValue(), v.totalAssets())))
				.sorted(Comparator.comparingLong(ReportFacts.Slice::amount).reversed())
				.toList();

		List<String> facts = new ArrayList<>();
		facts.add("총자산 %s, 부채 %s, 순자산 %s".formatted(won(v.totalAssets()), won(v.totalDebt()), won(v.netAssets())));
		for (ReportFacts.Slice s : slices) {
			facts.add("%s %s (총자산의 %.1f%%)".formatted(s.label(), won(s.amount()), s.weightPercent()));
		}
		if (income != null) {
			facts.add("월 소득 %s".formatted(won(income)));
		}
		if (expense != null) {
			facts.add("월 지출 %s".formatted(won(expense)));
		}
		if (surplus != null) {
			facts.add("월 여유금(소득-지출) %s".formatted(won(surplus)));
		}
		if (p != null && p.getEmergencyFund() != null && expense != null && expense > 0) {
			BigDecimal months = BigDecimal.valueOf(p.getEmergencyFund())
					.divide(BigDecimal.valueOf(expense), 1, RoundingMode.HALF_UP);
			facts.add("비상금 %s = 월 지출의 %s개월분".formatted(won(p.getEmergencyFund()), months.toPlainString()));
		}
		long investTotal = v.holdings().stream().mapToLong(PricedHolding::marketValue).sum();
		v.holdings().stream().max(Comparator.comparingLong(PricedHolding::marketValue)).ifPresent(top ->
				facts.add("주식·ETF %s 중 가장 큰 종목은 %s (%.1f%%)".formatted(won(investTotal),
						top.instrument().getName(), Numbers.weight(top.marketValue(), investTotal))));

		List<ReportContent.Source> sources = new ArrayList<>();
		sources.add(new ReportContent.Source("사용자 입력 재정정보", null,
				p == null ? null : Times.toKst(p.getUpdatedAt())));
		sources.add(new ReportContent.Source("실제 자산 평가(계좌 잔액·종목 시세·업비트 코인 시세)", null, v.meta().asOf()));

		List<String> limitations = new ArrayList<>(List.of(
				"계좌 잔액은 자산 연동 전 예시(시드) 데이터 기준이에요.",
				"투자 성향 진단 결과는 이번 레포트에 반영하지 않았어요.",
				"시세는 %s 기준이며 이후 달라질 수 있어요.".formatted(fmt(v.meta().asOf())),
				"개인 상황에 따라 판단이 달라질 수 있어 참고용으로만 활용해 주세요."));
		return new ReportFacts(Report.Kind.FINANCIAL, summary, slices, facts, sources, limitations, v.meta());
	}

	private ReportFacts paper() {
		Map<String, Instrument> instruments = instrumentRepository
				.findAllById(PaperPortfolioSnapshot.POSITIONS.stream()
						.map(PaperPortfolioSnapshot.Position::instrumentId).toList())
				.stream().collect(Collectors.toMap(Instrument::getId, Function.identity()));

		long cash = PaperPortfolioSnapshot.CASH_BALANCE;
		Map<AssetCategory, Long> byType = new EnumMap<>(AssetCategory.class);
		byType.put(AssetCategory.CASH, cash);
		List<String> holdingFacts = new ArrayList<>();
		long holdingsValue = 0;
		List<Instrument> used = new ArrayList<>();
		for (var pos : PaperPortfolioSnapshot.POSITIONS) {
			Instrument ins = instruments.get(pos.instrumentId());
			if (ins == null) {
				continue;
			}
			used.add(ins);
			long value = pos.quantity() * ins.getPrice();
			long cost = pos.quantity() * pos.averagePrice();
			holdingsValue += value;
			byType.merge(ins.getType() == Instrument.Type.ETF ? AssetCategory.ETF : AssetCategory.STOCK, value,
					Long::sum);
			holdingFacts.add("%s %d주: 평가 %s, 매입 %s, 손익 %s (%s%%)".formatted(ins.getName(), pos.quantity(),
					won(value), won(cost), won(value - cost), Numbers.percent(value - cost, cost)));
		}
		long totalValue = cash + holdingsValue;
		long profitLoss = totalValue - PaperPortfolioSnapshot.INITIAL_BALANCE;
		Double returnPercent = Numbers.percent(profitLoss, PaperPortfolioSnapshot.INITIAL_BALANCE);

		Map<String, Object> summary = new LinkedHashMap<>();
		summary.put("totalValue", totalValue);
		summary.put("profitLoss", profitLoss);
		summary.put("returnPercent", returnPercent);

		long total = totalValue;
		List<ReportFacts.Slice> slices = byType.entrySet().stream()
				.filter(e -> e.getValue() > 0)
				.map(e -> new ReportFacts.Slice(e.getKey().name(),
						e.getKey() == AssetCategory.CASH ? "가상 현금" : LABELS.get(e.getKey().name()), e.getValue(),
						Numbers.weight(e.getValue(), total)))
				.sorted(Comparator.comparingLong(ReportFacts.Slice::amount).reversed())
				.toList();

		List<String> facts = new ArrayList<>();
		facts.add("모의투자(가상 자금) 총 평가금액 %s, 시작 금액 %s, 손익 %s (수익률 %s%%)".formatted(won(totalValue),
				won(PaperPortfolioSnapshot.INITIAL_BALANCE), won(profitLoss), returnPercent));
		for (ReportFacts.Slice s : slices) {
			facts.add("%s %s (%.1f%%)".formatted(s.label(), won(s.amount()), s.weightPercent()));
		}
		facts.addAll(holdingFacts);

		Meta meta = MarketService.metaOf(used);
		List<ReportContent.Source> sources = List.of(
				new ReportContent.Source("모의투자 계좌(가상 자금)", null, null),
				new ReportContent.Source("종목 시세", null, meta.asOf()));
		List<String> limitations = List.of(
				"모의투자는 가상 자금이며 실제 돈이 아니에요.",
				"모의투자 계좌는 예시(시드) 데이터 기준이에요.",
				"과거 결과이며 앞으로를 보장하지 않아요.",
				"시세는 %s 기준이에요.".formatted(fmt(meta.asOf())));
		return new ReportFacts(Report.Kind.PAPER, summary, slices, facts, sources, limitations, meta);
	}

	static String won(long amount) {
		return String.format("%,d원", amount);
	}

	private static String fmt(OffsetDateTime t) {
		return t == null ? "최근" : "%d년 %d월 %d일".formatted(t.getYear(), t.getMonthValue(), t.getDayOfMonth());
	}
}
