package com.ganum.usage;

import java.util.EnumMap;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** application.yml 의 ganum.usage.costs (기능별 토큰 차감 단가). */
@ConfigurationProperties(prefix = "ganum.usage")
public record UsageProperties(Map<UsageFeature, Integer> costs) {

	public UsageProperties {
		EnumMap<UsageFeature, Integer> filled = new EnumMap<>(UsageFeature.class);
		for (UsageFeature feature : UsageFeature.values()) {
			Integer cost = costs == null ? null : costs.get(feature);
			if (cost == null || cost < 0) {
				throw new IllegalStateException("ganum.usage.costs." + feature + " 설정이 필요해요.");
			}
			filled.put(feature, cost);
		}
		costs = Map.copyOf(filled);
	}

	public int costOf(UsageFeature feature) {
		return costs.get(feature);
	}
}
