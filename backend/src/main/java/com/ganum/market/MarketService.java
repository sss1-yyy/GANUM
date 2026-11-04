package com.ganum.market;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.temporal.IsoFields;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ganum.common.api.ListData;
import com.ganum.common.api.Meta;
import com.ganum.common.api.Meta.DataSource;
import com.ganum.common.api.OffsetCursor;
import com.ganum.common.config.WebConfig;
import com.ganum.common.error.ApiException;
import com.ganum.common.error.ErrorCode;
import com.ganum.market.dto.InstrumentDetail;
import com.ganum.market.dto.InstrumentItem;
import com.ganum.market.dto.PriceChart;

@Service
@Transactional(readOnly = true)
public class MarketService {

	/** 장 마감 시각. 시세 asOf = 기준 거래일 15:30 KST */
	private static final LocalTime MARKET_CLOSE = LocalTime.of(15, 30);

	public enum Sort { TRADING_VALUE, VOLUME, GAINERS, LOSERS }

	public enum Interval { DAY, WEEK, MONTH }

	private final InstrumentRepository instrumentRepository;
	private final DailyPriceRepository dailyPriceRepository;

	public MarketService(InstrumentRepository instrumentRepository, DailyPriceRepository dailyPriceRepository) {
		this.instrumentRepository = instrumentRepository;
		this.dailyPriceRepository = dailyPriceRepository;
	}

	public Result<ListData<InstrumentItem>> search(String query, Instrument.Type type, Sort sort, String cursor,
			Integer limit) {
		if (query != null && (query.isBlank() || query.length() > 50)) {
			throw ApiException.validation("query", "1~50자로 입력해 주세요.");
		}
		Stream<Instrument> stream = instrumentRepository.findAll().stream();
		if (type != null) {
			stream = stream.filter(i -> i.getType() == type);
		}
		if (query != null) {
			String keyword = query.trim().toLowerCase(Locale.ROOT);
			stream = stream.filter(i -> i.getName().toLowerCase(Locale.ROOT).contains(keyword)
					|| i.getSymbol().contains(keyword));
		}
		Comparator<Instrument> byId = Comparator.comparing(Instrument::getId);
		List<Instrument> sorted = switch (sort == null ? Sort.TRADING_VALUE : sort) {
			case TRADING_VALUE -> stream.sorted(Comparator.comparingLong(Instrument::getTradingValue).reversed()
					.thenComparing(byId)).toList();
			case VOLUME -> stream.sorted(Comparator.comparingLong(Instrument::getVolume).reversed()
					.thenComparing(byId)).toList();
			case GAINERS -> stream.filter(i -> pct(i) > 0)
					.sorted(Comparator.comparingDouble(MarketService::pct).reversed().thenComparing(byId)).toList();
			case LOSERS -> stream.filter(i -> pct(i) < 0)
					.sorted(Comparator.comparingDouble(MarketService::pct).thenComparing(byId)).toList();
		};
		ListData<InstrumentItem> page = OffsetCursor.page(sorted.stream().map(InstrumentItem::from).toList(), cursor,
				limit);
		return new Result<>(page, metaOf(sorted));
	}

	public Result<InstrumentDetail> detail(String instrumentId) {
		Instrument instrument = find(instrumentId);
		return new Result<>(InstrumentDetail.from(instrument), metaOf(List.of(instrument)));
	}

	public Result<PriceChart> prices(String instrumentId, LocalDate from, LocalDate to, Interval interval) {
		Instrument instrument = find(instrumentId);
		if (from.isAfter(to)) {
			throw ApiException.validation("to", "시작일 이후여야 해요.");
		}
		// 명세: to 는 최신 확정 거래일 이하. 그 이후를 요청하면 최신 거래일까지만 돌려줍니다.
		LocalDate end = to.isAfter(instrument.getQuoteDate()) ? instrument.getQuoteDate() : to;
		List<DailyPrice> daily = from.isAfter(end) ? List.of()
				: dailyPriceRepository.findByInstrumentIdAndDateBetweenOrderByDateAsc(instrumentId, from, end);
		Interval iv = interval == null ? Interval.DAY : interval;
		List<PriceChart.Point> points = switch (iv) {
			case DAY -> daily.stream().map(p -> new PriceChart.Point(p.getDate(), p.getClose(), p.getVolume())).toList();
			case WEEK -> aggregate(daily, p -> p.getDate().get(IsoFields.WEEK_BASED_YEAR) * 100
					+ p.getDate().get(IsoFields.WEEK_OF_WEEK_BASED_YEAR));
			case MONTH -> aggregate(daily, p -> p.getDate().getYear() * 100 + p.getDate().getMonthValue());
		};
		return new Result<>(new PriceChart(instrumentId, iv.name(), points), metaOf(List.of(instrument)));
	}

	/** 같은 주/월끼리 묶어 마지막 거래일 종가 + 거래량 합계 */
	private static List<PriceChart.Point> aggregate(List<DailyPrice> daily, Function<DailyPrice, Integer> bucketOf) {
		Map<Integer, List<DailyPrice>> buckets = new LinkedHashMap<>();
		for (DailyPrice p : daily) {
			buckets.computeIfAbsent(bucketOf.apply(p), k -> new java.util.ArrayList<>()).add(p);
		}
		return buckets.values().stream().map(group -> {
			DailyPrice last = group.getLast();
			long volume = group.stream().mapToLong(DailyPrice::getVolume).sum();
			return new PriceChart.Point(last.getDate(), last.getClose(), volume);
		}).toList();
	}

	public Instrument find(String instrumentId) {
		return instrumentRepository.findById(instrumentId)
				.orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "종목을 찾을 수 없어요."));
	}

	/** 종목들의 시세 출처·기준 시각으로 meta 를 만듭니다. 출처가 섞이면 MIXED, asOf 는 가장 오래된 기준. */
	public static Meta metaOf(Collection<Instrument> instruments) {
		if (instruments.isEmpty()) {
			return new Meta(DataSource.MOCK, null);
		}
		List<DataSource> sources = instruments.stream().map(Instrument::getQuoteSource).distinct().toList();
		DataSource source = sources.size() == 1 ? sources.getFirst() : DataSource.MIXED;
		LocalDate oldest = instruments.stream().map(Instrument::getQuoteDate).min(LocalDate::compareTo).orElseThrow();
		return new Meta(source, asOf(oldest));
	}

	public static OffsetDateTime asOf(LocalDate tradeDate) {
		return tradeDate.atTime(MARKET_CLOSE).atZone(WebConfig.ZONE).toOffsetDateTime();
	}

	private static double pct(Instrument i) {
		return i.getChangePercent() == null ? 0 : i.getChangePercent();
	}

	public record Result<T>(T data, Meta meta) {
	}
}
