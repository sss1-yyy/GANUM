package com.ganum.common.error;

import org.springframework.http.HttpStatus;

/** 명세 "공통 오류" 표 + 각 API 의 업무 오류 코드. */
public enum ErrorCode {
	INVALID_REQUEST(HttpStatus.BAD_REQUEST, "요청 형식을 확인해 주세요."),
	INVALID_CURSOR(HttpStatus.BAD_REQUEST, "목록 위치 정보가 올바르지 않아요."),
	UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요해요."),
	FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없어요."),
	NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 정보를 찾을 수 없어요."),
	METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "지원하지 않는 요청 방식이에요."),
	TOKEN_INSUFFICIENT(HttpStatus.CONFLICT, "남은 이용권이 부족해요."),
	PROFILE_INCOMPLETE(HttpStatus.CONFLICT, "재정정보를 먼저 입력해 주세요."),
	VALIDATION_ERROR(HttpStatus.UNPROCESSABLE_CONTENT, "입력값을 확인해 주세요."),
	RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "잠시 후 다시 시도해 주세요."),
	INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "일시적인 오류가 발생했어요."),
	SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "서비스를 잠시 이용할 수 없어요."),
	AI_TIMEOUT(HttpStatus.GATEWAY_TIMEOUT, "AI 응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.");

	private final HttpStatus status;
	private final String defaultMessage;

	ErrorCode(HttpStatus status, String defaultMessage) {
		this.status = status;
		this.defaultMessage = defaultMessage;
	}

	public HttpStatus status() {
		return status;
	}

	public String defaultMessage() {
		return defaultMessage;
	}
}
