package com.ganum.market;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * ganum.market.* 설정.
 * dataGoKrServiceKey 가 비어 있으면 외부 호출 없이 시드 시세(MOCK)로만 동작합니다.
 */
@ConfigurationProperties(prefix = "ganum.market")
public record MarketProperties(String dataGoKrServiceKey, boolean syncOnStartup) {

	public boolean liveEnabled() {
		return dataGoKrServiceKey != null && !dataGoKrServiceKey.isBlank();
	}
}
