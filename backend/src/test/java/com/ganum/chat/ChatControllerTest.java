package com.ganum.chat;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
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
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@DisplayName("CHAT-01·03·04 챗봇")
class ChatControllerTest {

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcTemplate jdbc;

	@BeforeEach
	void enoughTokens() {
		jdbc.update("update usage_accounts set tokens_granted = 100, tokens_used = 0");
	}

	@Test
	@DisplayName("대화 생성 201: 화면별 제목·추천 질문, HOME 은 contextId=null")
	void createSession() throws Exception {
		mvc.perform(post("/api/v1/chat/sessions").contentType(MediaType.APPLICATION_JSON)
				.content("{\"contextType\":\"ASSET\",\"contextId\":null}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.data.contextType").value("ASSET"))
				.andExpect(jsonPath("$.data.contextId").isEmpty())
				.andExpect(jsonPath("$.data.title").value("내 자산"))
				.andExpect(jsonPath("$.data.suggestedQuestions", hasSize(3)));
		mvc.perform(post("/api/v1/chat/sessions").contentType(MediaType.APPLICATION_JSON)
				.content("{\"contextType\":\"INSTRUMENT\",\"contextId\":\"ins_005930\"}"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.data.title").value("삼성전자"));
	}

	@Test
	@DisplayName("대화 생성 검증: 잘못된 화면 422, 리소스 ID 누락 422, HOME 에 ID 422, 없는 종목·남의 레포트 404")
	void createValidation() throws Exception {
		postSession("{\"contextType\":\"SHOP\",\"contextId\":null}").andExpect(status().isUnprocessableContent());
		postSession("{\"contextType\":\"REPORT\",\"contextId\":null}").andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.error.fields[0].field").value("contextId"));
		postSession("{\"contextType\":\"HOME\",\"contextId\":\"x\"}").andExpect(status().isUnprocessableContent());
		postSession("{\"contextType\":\"INSTRUMENT\",\"contextId\":\"ins_nope\"}").andExpect(status().isNotFound());
		postSession("{\"contextType\":\"REPORT\",\"contextId\":\"999999\"}").andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("질문 전송: 사용자·AI 메시지 저장, 1토큰 차감, 목록은 오래된 순")
	void sendAndList() throws Exception {
		String sessionId = session("{\"contextType\":\"ASSET\",\"contextId\":null}");
		mvc.perform(post("/api/v1/chat/sessions/" + sessionId + "/messages").contentType(MediaType.APPLICATION_JSON)
				.content("{\"content\":\"  비중이 괜찮나요?  \"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.userMessage.role").value("USER"))
				.andExpect(jsonPath("$.data.userMessage.content").value("비중이 괜찮나요?"))
				.andExpect(jsonPath("$.data.userMessage.sources", hasSize(0)))
				.andExpect(jsonPath("$.data.assistantMessage.role").value("ASSISTANT"))
				.andExpect(jsonPath("$.data.assistantMessage.content").value(containsString("쉽게 말하면:")))
				.andExpect(jsonPath("$.data.assistantMessage.sources.length()").value(2))
				.andExpect(jsonPath("$.data.suggestedQuestions", hasSize(3)))
				.andExpect(jsonPath("$.data.tokensCharged").value(1));

		mvc.perform(get("/api/v1/chat/sessions/" + sessionId + "/messages"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.items", hasSize(2)))
				.andExpect(jsonPath("$.data.items[0].role").value("USER"))
				.andExpect(jsonPath("$.data.items[1].role").value("ASSISTANT"))
				.andExpect(jsonPath("$.data.nextCursor").isEmpty());
		mvc.perform(get("/api/v1/me/usage")).andExpect(jsonPath("$.data.tokenBalance").value(99));
	}

	@Test
	@DisplayName("최대 길이(2000자) 질문 + 출처가 여러 개인 답변도 저장됨 (칼럼 크기 회귀 방지)")
	void longContentIsStored() throws Exception {
		String sessionId = session("{\"contextType\":\"ASSET\",\"contextId\":null}");
		send(sessionId, "가".repeat(2000)).andExpect(status().isOk());
		mvc.perform(get("/api/v1/chat/sessions/" + sessionId + "/messages"))
				.andExpect(jsonPath("$.data.items[0].content").value("가".repeat(2000)))
				.andExpect(jsonPath("$.data.items[1].sources.length()").value(2));
	}

	@Test
	@DisplayName("전송 검증: 공백만 422, 2001자 422, 없는 대화 404, 토큰 0 이면 409 + 메시지 저장 안 함")
	void sendValidation() throws Exception {
		String sessionId = session("{\"contextType\":\"HOME\",\"contextId\":null}");
		send(sessionId, "   ").andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.error.fields[0].field").value("content"));
		send(sessionId, "가".repeat(2001)).andExpect(status().isUnprocessableContent());
		send("999999", "안녕").andExpect(status().isNotFound());

		jdbc.update("update usage_accounts set tokens_granted = 0, tokens_used = 0");
		send(sessionId, "안녕").andExpect(status().isConflict())
				.andExpect(jsonPath("$.error.code").value("TOKEN_INSUFFICIENT"));
		mvc.perform(get("/api/v1/chat/sessions/" + sessionId + "/messages"))
				.andExpect(jsonPath("$.data.items", hasSize(0)));
	}

	private org.springframework.test.web.servlet.ResultActions postSession(String json) throws Exception {
		return mvc.perform(post("/api/v1/chat/sessions").contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private org.springframework.test.web.servlet.ResultActions send(String sessionId, String content) throws Exception {
		return mvc.perform(post("/api/v1/chat/sessions/" + sessionId + "/messages")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"content\":\"" + content + "\"}"));
	}

	private String session(String json) throws Exception {
		String body = postSession(json).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.data.id");
	}
}
