package com.ganum.asset.dto;

import java.util.List;

/** ASSET-01 실제 자산 요약 */
public record AssetSummaryResponse(
		long totalAssets,
		long totalDebt,
		long netAssets,
		Long monthlyChangeAmount,
		Double monthlyChangePercent,
		List<Category> categories,
		String connectionStatus) {

	public record Category(String type, long amount, double weightPercent) {
	}
}
