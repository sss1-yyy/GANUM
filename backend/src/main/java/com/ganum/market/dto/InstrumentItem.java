package com.ganum.market.dto;

import com.ganum.market.Instrument;

/** MARKET-01 목록 항목 */
public record InstrumentItem(String id, String symbol, String name, String type, String market, long price,
		long changeAmount, Double changePercent, long volume, long tradingValue) {

	public static InstrumentItem from(Instrument i) {
		return new InstrumentItem(i.getId(), i.getSymbol(), i.getName(), i.getType().name(), i.getMarket(),
				i.getPrice(), i.getChangeAmount(), i.getChangePercent(), i.getVolume(), i.getTradingValue());
	}
}
