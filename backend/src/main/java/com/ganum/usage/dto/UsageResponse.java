package com.ganum.usage.dto;

import java.time.OffsetDateTime;
import java.util.List;

/** USAGE-01 응답. */
public record UsageResponse(
		String plan,
		int tokenBalance,
		int tokensGranted,
		int tokensUsed,
		OffsetDateTime resetsAt,
		List<Cost> costs) {

	public record Cost(String feature, int tokens) {
	}
}
