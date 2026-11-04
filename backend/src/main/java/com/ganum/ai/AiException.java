package com.ganum.ai;

import com.ganum.common.error.ErrorCode;

/** AI 호출 실패. code 는 AI_TIMEOUT(시간 초과) 또는 SERVICE_UNAVAILABLE(그 밖의 실패). */
public class AiException extends RuntimeException {

	private final ErrorCode code;

	public AiException(ErrorCode code, String message) {
		super(message);
		this.code = code;
	}

	public ErrorCode code() {
		return code;
	}
}
