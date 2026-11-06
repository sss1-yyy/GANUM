package com.ganum.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("USER-01 · USAGE-01")
class MeControllerTest {

	@Autowired
	MockMvc mvc;

	@Test
	@DisplayName("GET /me → 데모 사용자 정보를 data 로 감싸서 반환")
	void me() throws Exception {
		mvc.perform(get("/api/v1/me"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.id").isString())
				.andExpect(jsonPath("$.data.nickname").value("서연"))
				.andExpect(jsonPath("$.data.onboardingCompleted").value(true))
				.andExpect(jsonPath("$.meta").doesNotExist());
	}

	@Test
	@DisplayName("GET /me/usage → 잔액 = 지급 - 사용, 기능별 단가 포함")
	void usage() throws Exception {
		mvc.perform(get("/api/v1/me/usage"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.plan").value("FREE"))
				.andExpect(jsonPath("$.data.tokensGranted").value(10))
				.andExpect(jsonPath("$.data.tokensUsed").value(4))
				.andExpect(jsonPath("$.data.tokenBalance").value(6))
				.andExpect(jsonPath("$.data.resetsAt").isEmpty())
				.andExpect(jsonPath("$.data.costs.length()").value(3))
				.andExpect(jsonPath("$.data.costs[?(@.feature=='REPORT')].tokens").value(3));
	}

	@Test
	@DisplayName("없는 경로 → 404 + 공통 오류 형식")
	void notFound() throws Exception {
		mvc.perform(get("/api/v1/does-not-exist"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error.code").value("NOT_FOUND"))
				.andExpect(jsonPath("$.error.message").isString())
				.andExpect(jsonPath("$.error.fields").isArray());
	}
}
