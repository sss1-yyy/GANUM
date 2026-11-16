package com.ganum.market.dto;

import com.ganum.market.Instrument;

/** MARKET-02 종목 상세 */
public record InstrumentDetail(String id, String symbol, String name, String type, String market, long price,
		long changeAmount, Double changePercent, long volume, long tradingValue, Long marketCap, Long high52Week,
		Long low52Week) {

	public static InstrumentDetail from(Instrument i) {
		return new InstrumentDetail(i.getId(), i.getSymbol(), i.getName(), i.getType().name(), i.getMarket(),
				i.getPrice(), i.getChangeAmount(), i.getChangePercent(), i.getVolume(), i.getTradingValue(),
				i.getMarketCap(), i.getHigh52Week(), i.getLow52Week());
	}
}
