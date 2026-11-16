package com.ganum.ai;

import java.net.http.HttpClient;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.ganum.common.error.ErrorCode;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Google Gemini generateContent REST 호출. JSON 모드로 응답을 받아 파싱한 JsonNode 를 돌려줍니다.
 * API 키는 헤더(x-goog-api-key)로만 보내고 로그에 남기지 않습니다.
 */
@Component
public class GeminiClient {

	private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);

	private final AiProperties properties;
	private final ObjectMapper objectMapper;
	private final RestClient restClient;

	public GeminiClient(AiProperties properties, ObjectMapper objectMapper) {
		this.properties = properties;
		this.objectMapper = objectMapper;
		HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
		JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
		factory.setReadTimeout(Duration.ofSeconds(properties.timeoutSeconds()));
		this.restClient = RestClient.builder()
				.baseUrl("https://generativelanguage.googleapis.com/v1beta")
				.requestFactory(factory)
				.build();
	}

	public boolean enabled() {
		return properties.enabled();
	}

	public String model() {
		return properties.model();
	}

	/**
	 * @param systemPrompt 역할·규칙
	 * @param turns 대화 (role: "user" 또는 "model")
	 * @param responseSchema Gemini responseSchema (OpenAPI 부분집합)
	 */
	public Reply generateJson(String systemPrompt, List<Turn> turns, Map<String, Object> responseSchema) {
		if (!enabled()) {
			throw new AiException(ErrorCode.SERVICE_UNAVAILABLE, "AI 키가 설정되지 않았어요.");
		}
		List<Map<String, Object>> contents = new ArrayList<>();
		for (Turn t : turns) {
			contents.add(Map.of("role", t.role(), "parts", List.of(Map.of("text", t.text()))));
		}
		Map<String, Object> body = Map.of(
				"systemInstruction", Map.of("parts", List.of(Map.of("text", systemPrompt))),
				"contents", contents,
				"generationConfig", Map.of(
						"temperature", 0.4,
						"responseMimeType", "application/json",
						"responseSchema", responseSchema));
		String raw;
		try {
			raw = restClient.post()
					.uri("/models/{model}:generateContent", properties.model())
					.header("x-goog-api-key", properties.apiKey())
					.contentType(MediaType.APPLICATION_JSON)
					.body(body)
					.retrieve()
					.body(String.class);
		}
		catch (ResourceAccessException e) {
			boolean timeout = e.getCause() instanceof HttpTimeoutException
					|| e.getMessage() != null && e.getMessage().toLowerCase().contains("timed out");
			log.warn("Gemini 호출 실패({}): {}", timeout ? "timeout" : "io", e.getClass().getSimpleName());
			throw new AiException(timeout ? ErrorCode.AI_TIMEOUT : ErrorCode.SERVICE_UNAVAILABLE, "AI 호출 실패");
		}
		catch (RestClientResponseException e) {
			log.warn("Gemini 오류 응답: HTTP {}", e.getStatusCode().value());
			throw new AiException(e.getStatusCode().value() == 429 ? ErrorCode.RATE_LIMITED
					: ErrorCode.SERVICE_UNAVAILABLE, "AI 오류 응답");
		}

		JsonNode root = objectMapper.readTree(raw);
		JsonNode candidate = root.path("candidates").path(0);
		String text = candidate.path("content").path("parts").path(0).path("text").asString("");
		if (text.isBlank()) {
			log.warn("Gemini 빈 응답 (finishReason={})", candidate.path("finishReason").asString(""));
			throw new AiException(ErrorCode.SERVICE_UNAVAILABLE, "AI 응답이 비어 있어요.");
		}
		int tokens = root.path("usageMetadata").path("totalTokenCount").asInt(0);
		try {
			return new Reply(objectMapper.readTree(text), tokens);
		}
		catch (Exception e) {
			throw new AiException(ErrorCode.SERVICE_UNAVAILABLE, "AI 응답 형식 오류");
		}
	}

	public record Turn(String role, String text) {

		public static Turn user(String text) {
			return new Turn("user", text);
		}

		public static Turn model(String text) {
			return new Turn("model", text);
		}
	}

	/** json: 모델이 돌려준 JSON, totalTokens: 모델 입력+출력 토큰 수(비용 추적용, 서비스 토큰과 별개) */
	public record Reply(JsonNode json, int totalTokens) {
	}
}
