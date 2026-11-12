package com.ganum.market;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.ganum.common.api.Meta.DataSource;

/**
 * 공공데이터포털 시세로 종목 시세·차트를 갱신합니다.
 * 인증키가 없으면 아무것도 하지 않고 시드 시세(MOCK)를 그대로 씁니다.
 */
@Service
public class MarketSyncService {

	private static final Logger log = LoggerFactory.getLogger(MarketSyncService.class);
	/** 52주 고저가 + 차트 1년치를 위해 넉넉히 */
	private static final int HISTORY_DAYS = 400;

	private final DataGoKrStockClient client;
	private final InstrumentRepository instrumentRepository;
	private final DailyPriceRepository dailyPriceRepository;
	private final TransactionTemplate tx;
	private final Clock clock;
	private final ApplicationEventPublisher events;

	public MarketSyncService(DataGoKrStockClient client, InstrumentRepository instrumentRepository,
			DailyPriceRepository dailyPriceRepository, TransactionTemplate tx, Clock clock,
			ApplicationEventPublisher events) {
		this.client = client;
		this.instrumentRepository = instrumentRepository;
		this.dailyPriceRepository = dailyPriceRepository;
		this.tx = tx;
		this.clock = clock;
		this.events = events;
	}

	/** 평일 오후(전 영업일 시세가 올라온 뒤)에 갱신 */
	@Scheduled(cron = "0 30 13,18 * * MON-FRI", zone = "Asia/Seoul")
	public void scheduledSync() {
		syncAll();
	}

	/** @return LIVE 로 갱신된 종목 수 */
	public int syncAll() {
		if (!client.enabled()) {
			return 0;
		}
		LocalDate today = LocalDate.now(clock);
		LocalDate from = today.minusDays(HISTORY_DAYS);
		int updated = 0;
		for (Instrument instrument : instrumentRepository.findAll()) {
			List<DataGoKrStockClient.Bar> bars = client.fetchDaily(instrument, from, today);
			if (bars.isEmpty()) {
				continue;
			}
			tx.executeWithoutResult(status -> apply(instrument.getId(), bars));
			updated++;
		}
		log.info("시세 동기화 완료: {}개 종목 LIVE 갱신", updated);
		if (updated > 0) {
			events.publishEvent(new MarketSyncedEvent(updated));
		}
		return updated;
	}

	private void apply(String instrumentId, List<DataGoKrStockClient.Bar> bars) {
		Instrument instrument = instrumentRepository.findById(instrumentId).orElseThrow();
		dailyPriceRepository.deleteAllByInstrumentId(instrumentId);
		dailyPriceRepository.flush();
		dailyPriceRepository.saveAll(bars.stream()
				.map(b -> new DailyPrice(instrumentId, b.date(), b.close(), b.volume()))
				.toList());

		DataGoKrStockClient.Bar latest = bars.getLast();
		instrument.updateQuote(latest.toQuote(), DataSource.LIVE);
		LocalDate yearAgo = latest.date().minusWeeks(52);
		List<DataGoKrStockClient.Bar> lastYear = bars.stream().filter(b -> !b.date().isBefore(yearAgo)).toList();
		instrument.updateRange52Week(
				lastYear.stream().mapToLong(DataGoKrStockClient.Bar::close).max().stream().boxed().findFirst().orElse(null),
				lastYear.stream().mapToLong(DataGoKrStockClient.Bar::close).min().stream().boxed().findFirst().orElse(null));
	}
}
