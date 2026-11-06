package com.ganum.market;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import com.ganum.common.api.Meta.DataSource;

/**
 * 종목 시드. 값은 프론트 목데이터(frontend/src/mocks/shared/instruments.ts)와 같은 Figma 기준 예시입니다.
 * 공공데이터포털 인증키가 있으면 시드 직후 실제 시세로 덮어씁니다.
 */
@Component
public class MarketSeeder {

	private static final Logger log = LoggerFactory.getLogger(MarketSeeder.class);
	private static final long JO = 1_000_000_000_000L;

	private final InstrumentRepository instrumentRepository;
	private final DailyPriceRepository dailyPriceRepository;
	private final MarketSyncService syncService;
	private final MarketProperties properties;
	private final TransactionTemplate tx;
	private final Clock clock;

	public MarketSeeder(InstrumentRepository instrumentRepository, DailyPriceRepository dailyPriceRepository,
			MarketSyncService syncService, MarketProperties properties, TransactionTemplate tx, Clock clock) {
		this.instrumentRepository = instrumentRepository;
		this.dailyPriceRepository = dailyPriceRepository;
		this.syncService = syncService;
		this.properties = properties;
		this.tx = tx;
		this.clock = clock;
	}

	public void seed() {
		tx.executeWithoutResult(status -> insertSeeds());
		if (properties.liveEnabled() && properties.syncOnStartup()) {
			// 외부 호출이 서버 시작을 막지 않도록 별도 스레드에서
			Thread.ofVirtual().name("market-sync").start(syncService::syncAll);
		}
	}

	private void insertSeeds() {
		LocalDate quoteDate = lastTradingDayBefore(LocalDate.now(clock));
		int created = 0;
		for (Seed s : SEEDS) {
			if (instrumentRepository.existsById("ins_" + s.symbol)) {
				continue;
			}
			Instrument instrument = new Instrument(s.symbol, s.name, s.type);
			instrument.updateQuote(new Instrument.Quote(quoteDate, s.price, s.changeAmount, s.changePercent,
					s.volume, s.tradingValue, s.marketCap), DataSource.MOCK);
			instrument.updateRange52Week(s.high52Week, s.low52Week);
			instrumentRepository.save(instrument);
			if (!dailyPriceRepository.existsByInstrumentId(instrument.getId())) {
				dailyPriceRepository.saveAll(
						MockPriceGenerator.generate(instrument.getId(), s.price, quoteDate.minusDays(400), quoteDate));
			}
			created++;
		}
		if (created > 0) {
			log.info("종목 시드 {}개 생성 (기준일 {})", created, quoteDate);
		}
	}

	/** 오늘 이전의 가장 가까운 평일 (공공데이터 시세도 전 영업일 기준) */
	static LocalDate lastTradingDayBefore(LocalDate today) {
		LocalDate d = today.minusDays(1);
		while (d.getDayOfWeek() == DayOfWeek.SATURDAY || d.getDayOfWeek() == DayOfWeek.SUNDAY) {
			d = d.minusDays(1);
		}
		return d;
	}

	private record Seed(String symbol, String name, Instrument.Type type, long price, long changeAmount,
			Double changePercent, long volume, long tradingValue, Long marketCap, Long high52Week, Long low52Week) {
	}

	private static Seed stock(String symbol, String name, long price, long change, double pct, long volume,
			double tradingValueJo, Long marketCapJo, Long high, Long low) {
		return new Seed(symbol, name, Instrument.Type.STOCK, price, change, pct, volume,
				Math.round(tradingValueJo * JO), marketCapJo == null ? null : marketCapJo * JO, high, low);
	}

	private static Seed etf(String symbol, String name, long price, long change, double pct, long volume,
			double tradingValueJo) {
		return new Seed(symbol, name, Instrument.Type.ETF, price, change, pct, volume,
				Math.round(tradingValueJo * JO), null, null, null);
	}

	private static final List<Seed> SEEDS = new ArrayList<>(List.of(
			stock("005930", "삼성전자", 276_000, 0, 0, 1_240_000, 2.4, 400L, 310_000L, 180_000L),
			stock("042700", "한미반도체", 1_577_000, 20_100, 1.3, 860_000, 1.9, 15L, 1_700_000L, 900_000L),
			stock("402340", "SK스퀘어", 1_157_000, 1_200, 0.1, 710_000, 1.5, 15L, 1_300_000L, 700_000L),
			stock("000660", "SK하이닉스", 1_841_000, 7_400, 0.4, 580_000, 1.2, 134L, 2_010_000L, 1_120_000L),
			stock("009150", "삼성전기", 1_577_000, 15_600, 1.0, 440_000, 0.9, 12L, 1_800_000L, 1_000_000L),
			stock("035420", "NAVER", 191_500, -1_200, -0.6, 310_000, 0.6, 31L, null, null),
			stock("005380", "현대차", 241_000, 1_900, 0.8, 280_000, 0.55, 50L, null, null),
			stock("086520", "에코프로", 612_000, 67_700, 12.4, 120_000, 0.2, null, null, null),
			stock("454910", "두산로보틱스", 98_500, 8_800, 9.8, 150_000, 0.18, null, null, null),
			stock("196170", "알테오젠", 421_000, 31_500, 8.1, 90_000, 0.16, null, null, null),
			stock("010120", "LS일렉트릭", 236_000, 14_900, 6.7, 70_000, 0.14, null, null, null),
			stock("003670", "포스코퓨처엠", 193_100, 9_700, 5.3, 80_000, 0.13, null, null, null),
			stock("035720", "카카오", 41_200, -3_250, -7.3, 400_000, 0.17, null, null, null),
			stock("036570", "NC소프트", 198_000, -12_400, -5.9, 60_000, 0.12, null, null, null),
			stock("259960", "크래프톤", 312_000, -14_400, -4.4, 50_000, 0.11, null, null, null),
			stock("028300", "HLB", 62_300, -2_460, -3.8, 130_000, 0.1, null, null, null),
			stock("068270", "셀트리온", 172_500, -5_150, -2.9, 100_000, 0.09, null, null, null),
			etf("069500", "KODEX 200", 284_000, -1_700, -0.6, 900_000, 0.7),
			etf("360750", "TIGER 미국S&P500", 21_500, 60, 0.3, 700_000, 0.3)));
}
