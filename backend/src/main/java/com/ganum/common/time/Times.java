package com.ganum.common.time;

import java.time.Instant;
import java.time.OffsetDateTime;

import com.ganum.common.config.WebConfig;

/** DB 에는 Instant(UTC)로 저장하고, 응답은 RFC3339 +09:00 으로 내려줍니다. */
public final class Times {

	private Times() {
	}

	public static OffsetDateTime toKst(Instant instant) {
		return instant == null ? null : instant.atZone(WebConfig.ZONE).toOffsetDateTime();
	}
}
