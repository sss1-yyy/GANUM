package com.ganum.market.dto;

import java.time.LocalDate;
import java.util.List;

/** MARKET-03 종목 차트 */
public record PriceChart(String instrumentId, String interval, List<Point> points) {

	public record Point(LocalDate date, long close, long volume) {
	}
}
