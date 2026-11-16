package com.ganum.market;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * 시드용 가짜 일별 시세. 프론트 목데이터(prices.ts)와 같은 공식이라 차트 모양이 비슷합니다.
 * 같은 입력이면 항상 같은 결과이고, 마지막 거래일 종가는 현재가와 같습니다. 주말은 건너뜁니다.
 */
final class MockPriceGenerator {

	private MockPriceGenerator() {
	}

	static List<DailyPrice> generate(String instrumentId, long currentPrice, LocalDate from, LocalDate lastDay) {
		int seed = seedOf(instrumentId);
		List<DailyPrice> points = new ArrayList<>();
		for (LocalDate d = from; !d.isAfter(lastDay); d = d.plusDays(1)) {
			if (d.getDayOfWeek() == DayOfWeek.SATURDAY || d.getDayOfWeek() == DayOfWeek.SUNDAY) {
				continue;
			}
			long daysAgo = ChronoUnit.DAYS.between(d, lastDay);
			double wave = Math.sin((daysAgo + seed) / 2.7) * 0.012 + Math.cos((daysAgo + seed) / 9.0) * 0.02;
			double trend = daysAgo * 0.0002;
			long close = daysAgo == 0 ? currentPrice : roundToTick(currentPrice * (1 + wave - trend));
			long volume = 100_000 + Math.floorMod(seed + daysAgo * 7919, 50_000);
			points.add(new DailyPrice(instrumentId, d, close, volume));
		}
		return points;
	}

	private static int seedOf(String text) {
		int hash = 0;
		for (int i = 0; i < text.length(); i++) {
			hash = (hash * 31 + text.charAt(i)) % 9973;
		}
		return hash;
	}

	private static long roundToTick(double price) {
		long tick = price >= 500_000 ? 1000 : price >= 100_000 ? 500 : price >= 50_000 ? 100 : 50;
		return Math.round(price / tick) * tick;
	}
}
