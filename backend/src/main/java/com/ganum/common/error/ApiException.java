package com.ganum.common.error;

import java.util.List;

/** 서비스 코드에서 던지면 GlobalExceptionHandler 가 명세 오류 형식으로 바꿔 응답합니다. */
public class ApiException extends RuntimeException {

	private final ErrorCode code;
	private final List<ErrorResponse.FieldError> fields;

	public ApiException(ErrorCode code) {
		this(code, code.defaultMessage(), List.of());
	}

	public ApiException(ErrorCode code, String message) {
		this(code, message, List.of());
	}

	public ApiException(ErrorCode code, String message, List<ErrorResponse.FieldError> fields) {
		super(message);
		this.code = code;
		this.fields = List.copyOf(fields);
	}

	public static ApiException validation(String field, String message) {
		return new ApiException(ErrorCode.VALIDATION_ERROR, ErrorCode.VALIDATION_ERROR.defaultMessage(),
				List.of(new ErrorResponse.FieldError(field, message)));
	}

	public static ApiException notFound() {
		return new ApiException(ErrorCode.NOT_FOUND);
	}

	public ErrorCode code() {
		return code;
	}

	public List<ErrorResponse.FieldError> fields() {
		return fields;
	}
}
