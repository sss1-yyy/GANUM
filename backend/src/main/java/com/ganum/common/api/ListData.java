package com.ganum.common.api;

import java.util.List;

/** 목록 응답의 data: { items: [], nextCursor: null }. nextCursor 가 null 이면 마지막 페이지. */
public record ListData<T>(List<T> items, String nextCursor) {

	public static <T> ListData<T> of(List<T> items, String nextCursor) {
		return new ListData<>(List.copyOf(items), nextCursor);
	}

	public static <T> ListData<T> lastPage(List<T> items) {
		return of(items, null);
	}
}
