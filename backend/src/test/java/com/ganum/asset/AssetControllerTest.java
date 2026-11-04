package com.ganum.asset;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("ASSET-01·03·04 실제 자산")
class AssetControllerTest {

	@Autowired
	MockMvc mvc;

	/*
	 * 시드 기준 기대값 (테스트는 업비트·공공데이터를 부르지 않아 시드 가격 사용)
	 * 입출금 3,500,000 / 예적금 11,000,000
	 * 주식: 삼성전자 11×276,000 + SK하이닉스 1,841,000 + 한미반도체 1,577,000 = 6,454,000
	 * ETF: KODEX 200 5×284,000 = 1,420,000
	 * 코인: BTC 540,000 + ETH 300,000 + XRP 140,000 + SOL 80,000 = 1,060,000
	 */
	private static final long TOTAL = 3_500_000 + 11_000_000 + 6_454_000 + 1_420_000 + 1_060_000;

	@Test
	@DisplayName("요약: 카테고리 합계 = 총자산, 순자산 = 총자산 - 부채, 금액 큰 순")
	void summary() throws Exception {
		mvc.perform(get("/api/v1/assets/summary"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.totalAssets").value(TOTAL))
				.andExpect(jsonPath("$.data.totalDebt").value(0))
				.andExpect(jsonPath("$.data.netAssets").value(TOTAL))
				.andExpect(jsonPath("$.data.categories", hasSize(5)))
				.andExpect(jsonPath("$.data.categories[0].type").value("DEPOSIT"))
				.andExpect(jsonPath("$.data.categories[0].amount").value(11_000_000))
				.andExpect(jsonPath("$.data.connectionStatus").value("CONNECTED"))
				.andExpect(jsonPath("$.data.monthlyChangeAmount").isNumber())
				.andExpect(jsonPath("$.meta.source").value("MOCK"));
	}

	@Test
	@DisplayName("보유 목록: 평가액 = 수량 × 현재가, 수량·평균단가는 문자열, 비중 합 ≈ 100")
	void holdings() throws Exception {
		String body = mvc.perform(get("/api/v1/assets/holdings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.items", hasSize(4)))
				.andExpect(jsonPath("$.data.items[0].instrumentId").value("ins_005930"))
				.andExpect(jsonPath("$.data.items[0].quantity").value("11"))
				.andExpect(jsonPath("$.data.items[0].averagePrice").value("271921"))
				.andExpect(jsonPath("$.data.items[0].marketValue").value(3_036_000))
				.andExpect(jsonPath("$.data.items[0].profitLoss").value(3_036_000 - 11 * 271_921))
				.andExpect(jsonPath("$.data.nextCursor").isEmpty())
				.andReturn().getResponse().getContentAsString();
		java.util.List<Double> weights = JsonPath.read(body, "$.data.items[*].weightPercent");
		org.assertj.core.api.Assertions.assertThat(weights.stream().mapToDouble(Double::doubleValue).sum())
				.isBetween(99.8, 100.2);
	}

	@Test
	@DisplayName("추이: 날짜 오름차순, 마지막 날(오늘) = 요약 총자산")
	void history() throws Exception {
		LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Seoul"));
		mvc.perform(get("/api/v1/assets/history")
				.param("from", today.minusDays(30).toString()).param("to", today.toString()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.items.length()").value(31))
				.andExpect(jsonPath("$.data.items[0].date").value(today.minusDays(30).toString()))
				.andExpect(jsonPath("$.data.items[-1].date").value(today.toString()))
				.andExpect(jsonPath("$.data.items[-1].totalAssets").value(TOTAL))
				.andExpect(jsonPath("$.data.items[0].netAssets").value(greaterThan(0)))
				.andExpect(jsonPath("$.data.nextCursor").isEmpty());
	}

	@Test
	@DisplayName("추이 검증: 미래 날짜·366일 초과·from>to·누락 → 422")
	void historyValidation() throws Exception {
		LocalDate today = LocalDate.now(java.time.ZoneId.of("Asia/Seoul"));
		mvc.perform(get("/api/v1/assets/history").param("from", today.toString())
				.param("to", today.plusDays(1).toString()))
				.andExpect(status().isUnprocessableContent());
		mvc.perform(get("/api/v1/assets/history").param("from", today.minusDays(367).toString())
				.param("to", today.toString()))
				.andExpect(status().isUnprocessableContent());
		mvc.perform(get("/api/v1/assets/history").param("from", today.toString())
				.param("to", today.minusDays(1).toString()))
				.andExpect(status().isUnprocessableContent());
		mvc.perform(get("/api/v1/assets/history").param("to", today.toString()))
				.andExpect(status().isUnprocessableContent())
				.andExpect(jsonPath("$.error.fields[0].field").value("from"));
	}
}
