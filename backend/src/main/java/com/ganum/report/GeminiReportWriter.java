package com.ganum.report;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.ganum.ai.GeminiClient;

import tools.jackson.databind.JsonNode;

/**
 * Gemini 로 설명 문장을 씁니다. 숫자는 facts 에 있는 것만 쓰도록 지시하고,
 * 형식이 어긋난 부분은 템플릿 문장으로 채웁니다.
 */
@Component
class GeminiReportWriter implements ReportWriter {

	private static final String SYSTEM = """
			너는 20대 청년을 돕는 금융 코치 서비스 "가늠"의 레포트 작성기야.
			규칙:
			- 한국어 해요체로, 쉽고 짧게 써.
			- 숫자는 반드시 [사실] 목록에 있는 값만 그대로 써. 새로운 수치·수익률·금리를 만들지 마.
			- 확정 수익, "꼭 사세요", 특정 상품 가입 권유처럼 투자 권유로 보이는 표현은 금지.
			- 투자자산은 손실 가능성을 함께 알려.
			- advice 는 1~3개, title 은 25자 이내의 행동 제안("~해 보세요.")으로.
			- allocationReasons 는 주어진 각 category 마다 한 문장.
			- risks 는 1~4개, 집중도·변동성 등 주요 위험.
			""";

	private static final Map<String, Object> SCHEMA = Map.of(
			"type", "OBJECT",
			"properties", Map.of(
					"allocationReasons", Map.of("type", "ARRAY", "items", Map.of(
							"type", "OBJECT",
							"properties", Map.of("category", Map.of("type", "STRING"), "reason", Map.of("type", "STRING")),
							"required", List.of("category", "reason"))),
					"risks", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")),
					"advice", Map.of("type", "ARRAY", "items", Map.of(
							"type", "OBJECT",
							"properties", Map.of(
									"title", Map.of("type", "STRING"),
									"description", Map.of("type", "STRING"),
									"considerations", Map.of("type", "ARRAY", "items", Map.of("type", "STRING"))),
							"required", List.of("title", "description", "considerations"))),
					"limitations", Map.of("type", "ARRAY", "items", Map.of("type", "STRING"))),
			"required", List.of("allocationReasons", "risks", "advice"));

	private final GeminiClient gemini;
	private final TemplateReportWriter fallback;

	GeminiReportWriter(GeminiClient gemini, TemplateReportWriter fallback) {
		this.gemini = gemini;
		this.fallback = fallback;
	}

	@Override
	public Written write(ReportFacts facts) {
		StringBuilder prompt = new StringBuilder();
		prompt.append("레포트 종류: ").append(facts.kind() == Report.Kind.FINANCIAL ? "재정 레포트" : "모의투자 레포트(가상 자금)")
				.append("\n[사실]\n");
		facts.facts().forEach(f -> prompt.append("- ").append(f).append('\n'));
		prompt.append("[배분 category 목록]\n");
		facts.allocation().forEach(s -> prompt.append("- ").append(s.category()).append(" (").append(s.label())
				.append(", ").append(s.weightPercent()).append("%)\n"));

		GeminiClient.Reply reply = gemini.generateJson(SYSTEM, List.of(GeminiClient.Turn.user(prompt.toString())),
				SCHEMA);
		JsonNode json = reply.json();
		Written base = fallback.write(facts);

		Map<String, String> reasons = new LinkedHashMap<>(base.allocationReasons());
		for (JsonNode r : json.path("allocationReasons")) {
			String category = r.path("category").asString("");
			String text = clip(r.path("reason").asString(""), 200);
			if (reasons.containsKey(category) && !text.isBlank()) {
				reasons.put(category, text);
			}
		}
		List<String> risks = strings(json.path("risks"), 4, 200);
		List<ReportContent.Advice> advice = new ArrayList<>();
		for (JsonNode a : json.path("advice")) {
			String title = clip(a.path("title").asString(""), 40);
			if (title.isBlank() || advice.size() == 3) {
				continue;
			}
			advice.add(new ReportContent.Advice(title, clip(a.path("description").asString(""), 400),
					strings(a.path("considerations"), 3, 200)));
		}
		return new Written(reasons, risks.isEmpty() ? base.risks() : risks, advice.isEmpty() ? base.advice() : advice,
				strings(json.path("limitations"), 2, 200), reply.totalTokens());
	}

	private static List<String> strings(JsonNode array, int max, int maxLen) {
		List<String> out = new ArrayList<>();
		for (JsonNode n : array) {
			String s = clip(n.asString(""), maxLen);
			if (!s.isBlank() && out.size() < max) {
				out.add(s);
			}
		}
		return out;
	}

	private static String clip(String s, int max) {
		String t = s.strip();
		return t.length() <= max ? t : t.substring(0, max);
	}
}
