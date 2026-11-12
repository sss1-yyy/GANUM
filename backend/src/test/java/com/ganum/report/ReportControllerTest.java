package com.ganum.report;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS) // 토큰·알림을 실제로 바꾸므로 다른 테스트와 DB 분리
@DisplayName("REPORT-01·02·03 레포트")
class ReportControllerTest {

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcTemplate jdbc;

	@BeforeEach
	void enoughTokens() {
		jdbc.update("update usage_accounts set tokens_granted = 100, tokens_used = 0");
	}

	@Test
	@DisplayName("생성 202 QUEUED → 상세를 반복 조회하면 SUCCEEDED, 서버 계산 summary·배분 포함")
	void createAndPoll() throws Exception {
		String id = create("FINANCIAL");
		String body = pollUntilDone(id);

		assertThat((String) JsonPath.read(body, "$.data.status")).isEqualTo("SUCCEEDED");
		assertThat((Integer) JsonPath.read(body, "$.data.summary.monthlyIncome")).isEqualTo(1_100_000);
		assertThat((Integer) JsonPath.read(body, "$.data.summary.monthlySurplus")).isEqualTo(300_000);
		assertThat((String) JsonPath.read(body, "$.data.allocation[0].category")).isEqualTo("DEPOSIT");
		assertThat((String) JsonPath.read(body, "$.data.allocation[0].reason")).isNotBlank();
		assertThat((java.util.List<?>) JsonPath.read(body, "$.data.advice")).hasSizeBetween(1, 3);
		assertThat((java.util.List<?>) JsonPath.read(body, "$.data.priceChangeReasons")).isEmpty();
		assertThat((java.util.List<?>) JsonPath.read(body, "$.data.limitations")).isNotEmpty();
		assertThat((Object) JsonPath.read(body, "$.data.errorCode")).isNull();
		assertThat((String) JsonPath.read(body, "$.meta.source")).isEqualTo("MOCK");

		// 3토큰 차감 확인 (100 → 97)
		mvc.perform(get("/api/v1/me/usage")).andExpect(jsonPath("$.data.tokenBalance").value(97));
		// 완성 알림
		mvc.perform(get("/api/v1/notifications"))
				.andExpect(jsonPath("$.data.items[0].type").value("REPORT_READY"))
				.andExpect(jsonPath("$.data.items[0].target.resourceId").value(id));
	}

	@Test
	@DisplayName("PAPER 레포트: 모의투자 summary(totalValue·profitLoss·returnPercent)")
	void paper() throws Exception {
		String body = pollUntilDone(create("PAPER"));
		assertThat((String) JsonPath.read(body, "$.data.kind")).isEqualTo("PAPER");
		assertThat((Object) JsonPath.read(body, "$.data.summary.totalValue")).isNotNull();
		assertThat((Object) JsonPath.read(body, "$.data.summary.returnPercent")).isNotNull();
		assertThat((String) JsonPath.read(body, "$.data.limitations[0]")).contains("가상 자금");
	}

	@Test
	@DisplayName("목록: 최신순, SUCCEEDED 는 조언 제목 최대 3개를 headlines 로")
	void list() throws Exception {
		pollUntilDone(create("FINANCIAL"));
		String latest = create("PAPER");
		pollUntilDone(latest);
		mvc.perform(get("/api/v1/reports").param("limit", "1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.items", hasSize(1)))
				.andExpect(jsonPath("$.data.items[0].id").value(latest))
				.andExpect(jsonPath("$.data.items[0].headlines.length()").value(lessThanOrEqualTo(3)))
				.andExpect(jsonPath("$.data.nextCursor").isString());
	}

	@Test
	@DisplayName("검증: kind 누락·잘못된 값 422, 없는 레포트 404, 토큰 부족 409(차감 없음)")
	void errors() throws Exception {
		mvc.perform(post("/api/v1/reports").contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.error.fields[0].field").value("kind"));
		mvc.perform(post("/api/v1/reports").contentType(MediaType.APPLICATION_JSON).content("{\"kind\":\"WEEKLY\"}"))
				.andExpect(status().isUnprocessableContent());
		mvc.perform(get("/api/v1/reports/999999")).andExpect(status().isNotFound());

		jdbc.update("update usage_accounts set tokens_granted = 2, tokens_used = 0");
		mvc.perform(post("/api/v1/reports").contentType(MediaType.APPLICATION_JSON).content("{\"kind\":\"FINANCIAL\"}"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.error.code").value("TOKEN_INSUFFICIENT"));
		mvc.perform(get("/api/v1/me/usage")).andExpect(jsonPath("$.data.tokenBalance").value(2));
	}

	@Test
	@DisplayName("재정정보 미입력이면 FINANCIAL 은 409 PROFILE_INCOMPLETE")
	void profileIncomplete() throws Exception {
		jdbc.update("update financial_profiles set monthly_income = null");
		try {
			mvc.perform(post("/api/v1/reports").contentType(MediaType.APPLICATION_JSON)
					.content("{\"kind\":\"FINANCIAL\"}"))
					.andExpect(status().isConflict())
					.andExpect(jsonPath("$.error.code").value("PROFILE_INCOMPLETE"));
		}
		finally {
			jdbc.update("update financial_profiles set monthly_income = 1100000");
		}
	}

	private String create(String kind) throws Exception {
		String body = mvc.perform(post("/api/v1/reports").contentType(MediaType.APPLICATION_JSON)
				.content("{\"kind\":\"" + kind + "\"}"))
				.andExpect(status().isAccepted())
				.andExpect(jsonPath("$.data.status").value("QUEUED"))
				.andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.data.id");
	}

	/** 프론트의 pollUntilDone 과 같은 방식: SUCCEEDED/FAILED 가 될 때까지 상세 조회 */
	private String pollUntilDone(String id) throws Exception {
		for (int i = 0; i < 50; i++) {
			String body = mvc.perform(get("/api/v1/reports/" + id)).andExpect(status().isOk())
					.andReturn().getResponse().getContentAsString();
			String s = JsonPath.read(body, "$.data.status");
			if (s.equals("SUCCEEDED") || s.equals("FAILED")) {
				return body;
			}
			Thread.sleep(100);
		}
		throw new AssertionError("레포트가 5초 안에 끝나지 않았어요: " + id);
	}
}
