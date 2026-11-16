package com.ganum.common.api;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;

import com.ganum.common.error.ApiException;
import com.ganum.common.error.ErrorCode;

/**
 * "생성 시각 내림차순, 같으면 id 내림차순" 목록의 불투명 커서.
 * 마지막 항목의 (createdAt, id) 를 담아 다음 페이지는 그보다 앞선 항목부터 조회합니다. (명세 REPORT-02 정렬·페이지 규칙)
 */
public record KeysetCursor(Instant createdAt, long id) {

	private static final String PREFIX = "k:";

	public static KeysetCursor decode(String cursor) {
		if (cursor == null || cursor.isEmpty()) {
			return null;
		}
		try {
			String raw = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
			if (!raw.startsWith(PREFIX)) {
				throw new IllegalArgumentException();
			}
			String[] parts = raw.substring(PREFIX.length()).split(":");
			if (parts.length != 2) {
				throw new IllegalArgumentException();
			}
			return new KeysetCursor(Instant.ofEpochMilli(Long.parseLong(parts[0])), Long.parseLong(parts[1]));
		}
		catch (IllegalArgumentException e) {
			throw new ApiException(ErrorCode.INVALID_CURSOR);
		}
	}

	public String encode() {
		return Base64.getUrlEncoder().withoutPadding()
				.encodeToString((PREFIX + createdAt.toEpochMilli() + ":" + id).getBytes(StandardCharsets.UTF_8));
	}
}
