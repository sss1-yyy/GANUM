package com.ganum.common.api;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

import com.ganum.common.error.ApiException;
import com.ganum.common.error.ErrorCode;

/**
 * 순서가 고정된 목록용 불투명 커서(내부적으로는 시작 위치).
 * 잘못된 cursor 는 400 INVALID_CURSOR, 범위 밖 limit 은 422 VALIDATION_ERROR (명세 REPORT-02 기준을 전체 목록에 적용).
 */
public final class OffsetCursor {

	public static final int DEFAULT_LIMIT = 20;
	public static final int MAX_LIMIT = 100;
	private static final String PREFIX = "o:";

	private OffsetCursor() {
	}

	public static int limit(Integer limit) {
		if (limit == null) {
			return DEFAULT_LIMIT;
		}
		if (limit < 1 || limit > MAX_LIMIT) {
			throw ApiException.validation("limit", "1~100 사이여야 해요.");
		}
		return limit;
	}

	public static int decode(String cursor) {
		if (cursor == null || cursor.isEmpty()) {
			return 0;
		}
		try {
			String raw = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
			if (!raw.startsWith(PREFIX)) {
				throw new IllegalArgumentException();
			}
			int offset = Integer.parseInt(raw.substring(PREFIX.length()));
			if (offset < 0) {
				throw new IllegalArgumentException();
			}
			return offset;
		}
		catch (IllegalArgumentException e) {
			throw new ApiException(ErrorCode.INVALID_CURSOR);
		}
	}

	public static String encode(int offset) {
		return Base64.getUrlEncoder().withoutPadding()
				.encodeToString((PREFIX + offset).getBytes(StandardCharsets.UTF_8));
	}

	/** 전체 목록에서 한 페이지를 잘라 ListData 로 만듭니다. */
	public static <T> ListData<T> page(List<T> all, String cursor, Integer limit) {
		int size = limit(limit);
		int start = decode(cursor);
		if (start > all.size()) {
			throw new ApiException(ErrorCode.INVALID_CURSOR);
		}
		int end = Math.min(start + size, all.size());
		return ListData.of(all.subList(start, end), end < all.size() ? encode(end) : null);
	}
}
