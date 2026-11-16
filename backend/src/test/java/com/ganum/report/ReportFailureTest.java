package com.ganum.report;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.ganum.ai.AiException;
import com.ganum.common.error.ErrorCode;
import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("레포트 생성 실패 처리")
class ReportFailureTest {

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcTemplate jdbc;

	@MockitoBean
	TemplateReportWriter writer;

	@Test
	@DisplayName("AI 시간 초과 → 조회는 200 + FAILED/AI_TIMEOUT, 결과 비어 있음, 차감한 3토큰 환불")
	void aiTimeoutRefunds() throws Exception {
		when(writer.write(any())).thenThrow(new AiException(ErrorCode.AI_TIMEOUT, "timeout"));
		jdbc.update("update usage_accounts set tokens_granted = 10, tokens_used = 4");

		String body = mvc.perform(post("/api/v1/reports").contentType(MediaType.APPLICATION_JSON)
				.content("{\"kind\":\"FINANCIAL\"}"))
				.andExpect(status().isAccepted())
				.andReturn().getResponse().getContentAsString();
		String id = JsonPath.read(body, "$.data.id");

		String detail = null;
		for (int i = 0; i < 50; i++) {
			detail = mvc.perform(get("/api/v1/reports/" + id)).andExpect(status().isOk())
					.andReturn().getResponse().getContentAsString();
			if (!"QUEUED".equals(JsonPath.read(detail, "$.data.status"))
					&& !"RUNNING".equals(JsonPath.read(detail, "$.data.status"))) {
				break;
			}
			Thread.sleep(100);
		}
		assertThat((String) JsonPath.read(detail, "$.data.status")).isEqualTo("FAILED");
		assertThat((String) JsonPath.read(detail, "$.data.errorCode")).isEqualTo("AI_TIMEOUT");
		assertThat((Object) JsonPath.read(detail, "$.data.summary")).isNull();
		assertThat((java.util.List<?>) JsonPath.read(detail, "$.data.advice")).isEmpty();

		mvc.perform(get("/api/v1/me/usage")).andExpect(jsonPath("$.data.tokenBalance").value(6));
	}
}
