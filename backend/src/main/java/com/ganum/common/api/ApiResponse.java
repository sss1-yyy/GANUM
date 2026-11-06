package com.ganum.common.api;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 명세 공통 성공 응답: { "data": ..., "meta"?: {...} }.
 * data 가 null 인 경우(예: 미진단)도 "data": null 로 그대로 내려갑니다.
 */
public record ApiResponse<T>(
		T data,
		@JsonInclude(JsonInclude.Include.NON_NULL) Meta meta) {

	public static <T> ApiResponse<T> of(T data) {
		return new ApiResponse<>(data, null);
	}

	public static <T> ApiResponse<T> of(T data, Meta meta) {
		return new ApiResponse<>(data, meta);
	}
}
