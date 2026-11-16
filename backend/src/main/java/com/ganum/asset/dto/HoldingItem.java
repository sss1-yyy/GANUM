package com.ganum.asset.dto;

/** ASSET-03 보유 종목 항목 (PAPER-01 holdings 와 같은 구조) */
public record HoldingItem(
		String instrumentId,
		String name,
		String quantity,
		String averagePrice,
		long currentPrice,
		long marketValue,
		Long profitLoss,
		Double profitLossPercent,
		double weightPercent) {
}
