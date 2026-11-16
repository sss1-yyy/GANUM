package com.ganum.common.auth;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 컨트롤러 파라미터에 붙이면 로그인한 사용자의 내부 ID(Long)가 들어옵니다.
 * 명세: userId 는 요청 본문/경로로 받지 않습니다.
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentUserId {
}
