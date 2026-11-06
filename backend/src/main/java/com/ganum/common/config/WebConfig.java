package com.ganum.common.config;

import java.time.Clock;
import java.time.ZoneId;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.ganum.common.auth.DemoUserResolver;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	/** 서비스 기준 시간대. "오늘" 판단과 응답 시각(+09:00)은 모두 이 시계를 씁니다. */
	public static final ZoneId ZONE = ZoneId.of("Asia/Seoul");

	private final DemoUserResolver demoUserResolver;
	private final String[] allowedOrigins;

	public WebConfig(DemoUserResolver demoUserResolver,
			@Value("${ganum.cors.allowed-origins}") String[] allowedOrigins) {
		this.demoUserResolver = demoUserResolver;
		this.allowedOrigins = allowedOrigins;
	}

	@Bean
	Clock clock() {
		return Clock.system(ZONE);
	}

	@Override
	public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
		resolvers.add(demoUserResolver);
	}

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/api/**")
				.allowedOrigins(allowedOrigins)
				.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
				.allowedHeaders("*")
				.exposedHeaders("Location");
	}
}
