package com.ganum.asset;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** ganum.crypto.* — 업비트 공개 시세 사용 여부 */
@ConfigurationProperties(prefix = "ganum.crypto")
public record CryptoProperties(boolean upbitEnabled) {
}
