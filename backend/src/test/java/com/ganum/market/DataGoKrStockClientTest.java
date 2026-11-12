package com.ganum.market;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import tools.jackson.databind.json.JsonMapper;

@DisplayName("공공데이터포털 시세 응답 파싱")
class DataGoKrStockClientTest {

	private final DataGoKrStockClient client = new DataGoKrStockClient(new MarketProperties("", false),
			JsonMapper.builder().build());

	@Test
	@DisplayName("정상 응답 → 정확히 일치하는 종목코드만, 날짜 오름차순")
	void parsesRows() {
		String body = """
				{"response":{"header":{"resultCode":"00","resultMsg":"NORMAL SERVICE."},
				 "body":{"numOfRows":3,"pageNo":1,"totalCount":3,"items":{"item":[
				  {"basDt":"20261023","srtnCd":"005930","itmsNm":"삼성전자","clpr":"276000","vs":"1500","fltRt":".55","trqu":"1240000","trPrc":"342240000000","mrktTotAmt":"1647712000000000"},
				  {"basDt":"20261022","srtnCd":"005930","itmsNm":"삼성전자","clpr":"274500","vs":"-500","fltRt":"-.18","trqu":"1100000","trPrc":"301950000000","mrktTotAmt":"1638000000000000"},
				  {"basDt":"20261023","srtnCd":"0059301","itmsNm":"다른종목","clpr":"1","vs":"0","fltRt":"0","trqu":"0","trPrc":"0","mrktTotAmt":"0"}
				 ]}}}}
				""";
		List<DataGoKrStockClient.Bar> bars = client.parse(body, "005930");

		assertThat(bars).hasSize(2);
		assertThat(bars.get(0).date()).isEqualTo(LocalDate.of(2026, 10, 22));
		assertThat(bars.get(1).close()).isEqualTo(276000);
		assertThat(bars.get(1).changePercent()).isEqualTo(0.55);
		assertThat(bars.get(0).change()).isEqualTo(-500);
	}

	@Test
	@DisplayName("결과 1건이면 item 이 배열이 아니라 객체로 와도 처리")
	void singleItemObject() {
		String body = """
				{"response":{"header":{"resultCode":"00"},"body":{"items":{"item":
				  {"basDt":"20261023","srtnCd":"069500","clpr":"284000","vs":"-1700","fltRt":"-.6","trqu":"900000","trPrc":"1","mrktTotAmt":"1"}
				}}}}
				""";
		assertThat(client.parse(body, "069500")).hasSize(1);
	}

	@Test
	@DisplayName("결과 없음(items 빈 문자열)·오류 코드·XML 오류 응답 → 빈 목록")
	void emptyOrError() {
		assertThat(client.parse("""
				{"response":{"header":{"resultCode":"00"},"body":{"items":""}}}
				""", "005930")).isEmpty();
		assertThat(client.parse("""
				{"response":{"header":{"resultCode":"30","resultMsg":"SERVICE_KEY_IS_NOT_REGISTERED_ERROR"}}}
				""", "005930")).isEmpty();
		assertThat(client.parse("<OpenAPI_ServiceResponse><cmmMsgHeader>...</cmmMsgHeader></OpenAPI_ServiceResponse>",
				"005930")).isEmpty();
	}
}
