package com.ganum.common.error;

import java.util.List;

/** 명세 공통 오류 응답: { "error": { "code", "message", "fields": [] } } */
public record ErrorResponse(Body error) {

	public record Body(String code, String message, List<FieldError> fields) {
	}

	public record FieldError(String field, String message) {
	}

	public static ErrorResponse of(String code, String message, List<FieldError> fields) {
		return new ErrorResponse(new Body(code, message, List.copyOf(fields)));
	}
}
