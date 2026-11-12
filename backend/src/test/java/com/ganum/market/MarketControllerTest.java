package com.ganum.market;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("MARKET-01·02·03 종목")
class MarketControllerTest {

	@Autowired
	MockMvc mvc;

	@Test
	@DisplayName("목록 기본 정렬은 거래대금 순, meta.source=MOCK")
	void listByTradingValue() throws Exception {
		mvc.perform(get("/api/v1/instruments"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.items[0].name").value("삼성전자"))
				.andExpect(jsonPath("$.data.items[0].id").value("ins_005930"))
				.andExpect(jsonPath("$.data.items[0].market").value("KRX"))
				.andExpect(jsonPath("$.data.items[0].marketCap").doesNotExist())
				.andExpect(jsonPath("$.data.nextCursor").isEmpty())
				.andExpect(jsonPath("$.meta.source").value("MOCK"))
				.andExpect(jsonPath("$.meta.asOf").isString());
	}

	@Test
	@DisplayName("급상승(GAINERS)은 상승 종목만, 등락률 내림차순")
	void gainers() throws Exception {
		mvc.perform(get("/api/v1/instruments").param("sort", "GAINERS"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.items[0].name").value("에코프로"))
				.andExpect(jsonPath("$.data.items[*].changePercent").value(
						org.hamcrest.Matchers.everyItem(greaterThan(0.0))));
	}

	@Test
	@DisplayName("검색어·유형 필터")
	void searchAndType() throws Exception {
		mvc.perform(get("/api/v1/instruments").param("query", "삼성"))
				.andExpect(jsonPath("$.data.items", hasSize(2)));
		mvc.perform(get("/api/v1/instruments").param("type", "ETF"))
				.andExpect(jsonPath("$.data.items", hasSize(2)));
	}

	@Test
	@DisplayName("cursor·limit 페이지 이동, 잘못된 cursor 400, 범위 밖 limit 422")
	void paging() throws Exception {
		String body = mvc.perform(get("/api/v1/instruments").param("limit", "5"))
				.andExpect(jsonPath("$.data.items", hasSize(5)))
				.andExpect(jsonPath("$.data.nextCursor").isString())
				.andReturn().getResponse().getContentAsString();
		String next = JsonPath.read(body, "$.data.nextCursor");

		mvc.perform(get("/api/v1/instruments").param("limit", "5").param("cursor", next))
				.andExpect(jsonPath("$.data.items", hasSize(5)));
		mvc.perform(get("/api/v1/instruments").param("cursor", "garbage!!"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error.code").value("INVALID_CURSOR"));
		mvc.perform(get("/api/v1/instruments").param("limit", "101"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.error.fields[0].field").value("limit"));
	}

	@Test
	@DisplayName("상세: 52주 고저가·시가총액 포함, 없는 종목 404")
	void detail() throws Exception {
		mvc.perform(get("/api/v1/instruments/ins_005930"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.price").value(276000))
				.andExpect(jsonPath("$.data.marketCap").value(400_000_000_000_000L))
				.andExpect(jsonPath("$.data.high52Week").value(310000));
		mvc.perform(get("/api/v1/instruments/ins_nope"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
	}

	@Test
	@DisplayName("차트: 날짜 오름차순, 마지막 종가 = 현재가, WEEK 는 주 단위로 묶임")
	void prices() throws Exception {
		String body = mvc.perform(get("/api/v1/instruments/ins_005930/prices")
				.param("from", "2025-01-01").param("to", "2099-12-31"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.instrumentId").value("ins_005930"))
				.andExpect(jsonPath("$.data.interval").value("DAY"))
				.andExpect(jsonPath("$.data.points.length()").value(greaterThan(200)))
				.andReturn().getResponse().getContentAsString();
		Integer lastClose = JsonPath.read(body, "$.data.points[-1].close");
		org.assertj.core.api.Assertions.assertThat(lastClose).isEqualTo(276000);

		mvc.perform(get("/api/v1/instruments/ins_005930/prices")
				.param("from", "2025-01-01").param("to", "2099-12-31").param("interval", "WEEK"))
				.andExpect(jsonPath("$.data.points.length()").value(lessThanOrEqualTo(70)));
	}

	@Test
	@DisplayName("차트 검증: from 누락 422, from > to 422, 잘못된 interval 422")
	void pricesValidation() throws Exception {
		mvc.perform(get("/api/v1/instruments/ins_005930/prices").param("to", "2026-10-01"))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.error.fields[0].field").value("from"));
		mvc.perform(get("/api/v1/instruments/ins_005930/prices").param("from", "2026-10-02").param("to", "2026-10-01"))
				.andExpect(status().isUnprocessableContent());
		mvc.perform(get("/api/v1/instruments/ins_005930/prices").param("from", "2026-10-01").param("to", "2026-10-02")
				.param("interval", "YEAR"))
				.andExpect(status().isUnprocessableContent());
	}
}
