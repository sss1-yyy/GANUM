package com.ganum.ai;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * ganum.ai.* — Gemini 설정. apiKey 가 비어 있으면 AI 를 부르지 않고 템플릿 문장으로 대신합니다.
 */
@ConfigurationProperties(prefix = "ganum.ai")
public record AiProperties(String apiKey, String model, int timeoutSeconds) {

	public AiProperties {
		if (model == null || model.isBlank()) {
			model = "gemini-2.5-flash";
		}
		if (timeoutSeconds <= 0) {
			timeoutSeconds = 30;
		}
	}

	public boolean enabled() {
		return apiKey != null && !apiKey.isBlank();
	}
}
