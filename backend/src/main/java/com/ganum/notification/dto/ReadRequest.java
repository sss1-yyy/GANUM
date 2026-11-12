package com.ganum.notification.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

/** NOTI-02 요청. read 는 true 만 허용 */
public record ReadRequest(
		@NotNull(message = "필수 값이에요.") @AssertTrue(message = "true 만 보낼 수 있어요.") Boolean read) {
}
