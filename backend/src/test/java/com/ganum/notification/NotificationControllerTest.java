package com.ganum.notification;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional // 읽음 처리 등 변경을 테스트마다 되돌림
@DisplayName("NOTI-01·02 알림")
class NotificationControllerTest {

	@Autowired
	MockMvc mvc;

	@Test
	@DisplayName("시드 알림: 환영(SYSTEM) + 청년도약계좌 마감 D-5(BENEFIT_DEADLINE), 최신순")
	void list() throws Exception {
		mvc.perform(get("/api/v1/notifications"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.items", hasSize(2)))
				.andExpect(jsonPath("$.data.items[0].type").value("BENEFIT_DEADLINE"))
				.andExpect(jsonPath("$.data.items[0].title").value("청년도약계좌 신청 마감 D-5"))
				.andExpect(jsonPath("$.data.items[0].target.type").value("BENEFIT"))
				.andExpect(jsonPath("$.data.items[0].target.resourceId").value("ben_youth_leap"))
				.andExpect(jsonPath("$.data.items[0].readAt").isEmpty())
				.andExpect(jsonPath("$.data.items[1].type").value("SYSTEM"))
				.andExpect(jsonPath("$.data.items[1].target.resourceId").isEmpty())
				.andExpect(jsonPath("$.data.nextCursor").isEmpty());
	}

	@Test
	@DisplayName("읽음 처리 → readAt 채워지고, unreadOnly=true 목록에서 빠짐")
	void markRead() throws Exception {
		String id = firstId();
		mvc.perform(patch("/api/v1/notifications/" + id).contentType(MediaType.APPLICATION_JSON)
				.content("{\"read\":true}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.id").value(id))
				.andExpect(jsonPath("$.data.readAt").isString());
		mvc.perform(get("/api/v1/notifications").param("unreadOnly", "true"))
				.andExpect(jsonPath("$.data.items", hasSize(1)));
	}

	@Test
	@DisplayName("read=false·누락 → 422, 잘못된 JSON → 400, 없는 알림 → 404")
	void readValidation() throws Exception {
		String id = firstId();
		mvc.perform(patch("/api/v1/notifications/" + id).contentType(MediaType.APPLICATION_JSON)
				.content("{\"read\":false}"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.error.fields[0].field").value("read"));
		mvc.perform(patch("/api/v1/notifications/" + id).contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isUnprocessableContent());
		mvc.perform(patch("/api/v1/notifications/" + id).contentType(MediaType.APPLICATION_JSON).content("{read"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.code").value("INVALID_REQUEST"));
		mvc.perform(patch("/api/v1/notifications/999999").contentType(MediaType.APPLICATION_JSON)
				.content("{\"read\":true}"))
				.andExpect(status().isNotFound());
		mvc.perform(patch("/api/v1/notifications/abc").contentType(MediaType.APPLICATION_JSON)
				.content("{\"read\":true}"))
				.andExpect(status().isNotFound());
	}

	@Test
	@DisplayName("limit=1 로 커서를 따라가면 2페이지에서 끝")
	void cursorPaging() throws Exception {
		String body = mvc.perform(get("/api/v1/notifications").param("limit", "1"))
				.andExpect(jsonPath("$.data.items", hasSize(1)))
				.andReturn().getResponse().getContentAsString();
		String next = JsonPath.read(body, "$.data.nextCursor");
		mvc.perform(get("/api/v1/notifications").param("limit", "1").param("cursor", next))
				.andExpect(jsonPath("$.data.items", hasSize(1)))
				.andExpect(jsonPath("$.data.items[0].type").value("SYSTEM"))
				.andExpect(jsonPath("$.data.nextCursor").isEmpty());
		mvc.perform(get("/api/v1/notifications").param("cursor", "nope"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.code").value("INVALID_CURSOR"));
	}

	private String firstId() throws Exception {
		String body = mvc.perform(get("/api/v1/notifications")).andReturn().getResponse().getContentAsString();
		return JsonPath.read(body, "$.data.items[0].id");
	}
}
