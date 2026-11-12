package com.ganum.asset;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
@DisplayName("[명세 외] 내 자산 상세 (계좌·예적금·코인·연결)")
class AssetDetailControllerTest {

	@Autowired
	MockMvc mvc;

	@Test
	@DisplayName("계좌 목록: 입출금 3개 + 증권 계좌 1개(보유 종목 평가액 합계)")
	void accounts() throws Exception {
		mvc.perform(get("/api/v1/assets/accounts"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.items", hasSize(4)))
				.andExpect(jsonPath("$.data.items[0].institution").value("카카오뱅크"))
				.andExpect(jsonPath("$.data.items[0].type").value("CASH"))
				.andExpect(jsonPath("$.data.items[3].type").value("STOCK"))
				.andExpect(jsonPath("$.data.items[3].balance").value(6_454_000 + 1_420_000))
				.andExpect(jsonPath("$.meta.source").value("MOCK"));
	}

	@Test
	@DisplayName("예적금: 합계 11,000,000, 이율·기간·월 납입액, 비교 기록 없으면 monthlyChangeAmount=null")
	void savings() throws Exception {
		mvc.perform(get("/api/v1/assets/savings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.totalAmount").value(11_000_000))
				.andExpect(jsonPath("$.data.monthlyChangeAmount").isEmpty())
				.andExpect(jsonPath("$.data.items", hasSize(4)))
				.andExpect(jsonPath("$.data.items[0].name").value("청년도약계좌"))
				.andExpect(jsonPath("$.data.items[0].interestRate").value(4.5))
				.andExpect(jsonPath("$.data.items[0].termMonths").value(60))
				.andExpect(jsonPath("$.data.items[0].monthlyDeposit").value(700_000))
				.andExpect(jsonPath("$.data.items[3].termMonths").isEmpty());
	}

	@Test
	@DisplayName("코인: 수량은 문자열, 평가금액 = 수량 × 시세, 합계 = ASSET-01 의 CRYPTO 금액")
	void crypto() throws Exception {
		mvc.perform(get("/api/v1/assets/crypto"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.data.items", hasSize(4)))
				.andExpect(jsonPath("$.data.items[0].id").value("btc"))
				.andExpect(jsonPath("$.data.items[0].symbol").value("BTC"))
				.andExpect(jsonPath("$.data.items[0].quantity").value("0.008"))
				.andExpect(jsonPath("$.data.items[0].amount").value(540_000))
				.andExpect(jsonPath("$.data.items[0].changePercent").value(-3.2))
				.andExpect(jsonPath("$.data.totalAmount").value(1_060_000));
	}

	@Test
	@DisplayName("연결하기: 201 + 자산 요약, 이미 연결돼 있으면 중복 생성 없음")
	void connect() throws Exception {
		mvc.perform(post("/api/v1/assets/connections"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.data.connectionStatus").value("CONNECTED"))
				.andExpect(jsonPath("$.data.totalAssets").value(3_500_000 + 11_000_000 + 6_454_000 + 1_420_000 + 1_060_000));
		mvc.perform(get("/api/v1/assets/accounts")).andExpect(jsonPath("$.data.items", hasSize(4)));
	}
}
