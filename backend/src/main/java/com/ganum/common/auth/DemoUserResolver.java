package com.ganum.common.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.ganum.common.error.ApiException;
import com.ganum.common.error.ErrorCode;
import com.ganum.user.UserRepository;

/**
 * 로그인은 목데이터 범위라서, Authorization 헤더와 상관없이 항상 시드된 데모 사용자로 처리합니다.
 * 실제 로그인을 붙일 때는 이 클래스만 토큰 검증 방식으로 바꾸면 됩니다.
 */
@Component
public class DemoUserResolver implements HandlerMethodArgumentResolver {

	private final UserRepository userRepository;
	private final String demoLoginId;

	public DemoUserResolver(UserRepository userRepository, @Value("${ganum.auth.demo-login-id}") String demoLoginId) {
		this.userRepository = userRepository;
		this.demoLoginId = demoLoginId;
	}

	@Override
	public boolean supportsParameter(MethodParameter parameter) {
		return parameter.hasParameterAnnotation(CurrentUserId.class)
				&& Long.class.equals(parameter.getParameterType());
	}

	@Override
	public Long resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
			NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
		return userRepository.findByLoginId(demoLoginId)
				.orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED))
				.getId();
	}
}
