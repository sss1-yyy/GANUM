package com.ganum.market;

import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * 공공데이터포털 "금융위원회_주식시세정보"(주식) / "금융위원회_증권상품시세정보"(ETF) 클라이언트.
 * 무료이며 전 영업일 종가 기준(보통 다음 영업일 오후 1시 이후 갱신)입니다.
 * 인증키는 서버 설정(DATA_GO_KR_SERVICE_KEY)에만 두고, 로그에 요청 URL 을 남기지 않습니다.
 */
@Component
public class DataGoKrStockClient {

	private static final Logger log = LoggerFactory.getLogger(DataGoKrStockClient.class);
	// 2026-11 기준 V2 호출 주소. 서비스 이름과 기능 이름 모두 끝에 _V2 가 붙습니다.
	// (예전 getStockPriceInfo 는 V2 에서 NO_OPENAPI_SERVICE_ERROR) 상세: data.go.kr/data/15094808, 15094806
	private static final String BASE = "https://apis.data.go.kr/1160100";
	private static final String STOCK_PATH = "/GetStockSecuritiesInfoService_V2/getStockPriceInfo_V2";
	private static final String ETF_PATH = "/GetSecuritiesProductInfoService_V2/getETFPriceInfo_V2";
	private static final DateTimeFormatter BASIC = DateTimeFormatter.BASIC_ISO_DATE;

	private final MarketProperties properties;
	private final ObjectMapper objectMapper;
	private final RestClient restClient;

	public DataGoKrStockClient(MarketProperties properties, ObjectMapper objectMapper) {
		this.properties = properties;
		this.objectMapper = objectMapper;
		HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
		JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
		factory.setReadTimeout(Duration.ofSeconds(15));
		this.restClient = RestClient.builder().requestFactory(factory).build();
	}

	public boolean enabled() {
		return properties.liveEnabled();
	}

	/** 기간 내 일별 시세를 날짜 오름차순으로 반환합니다. 실패하면 빈 목록. */
	public List<Bar> fetchDaily(Instrument instrument, LocalDate from, LocalDate to) {
		if (!enabled()) {
			return List.of();
		}
		URI uri = UriComponentsBuilder.fromUriString(BASE)
				.path(instrument.getType() == Instrument.Type.ETF ? ETF_PATH : STOCK_PATH)
				.queryParam("serviceKey", properties.dataGoKrServiceKey())
				.queryParam("resultType", "json")
				.queryParam("likeSrtnCd", instrument.getSymbol())
				.queryParam("beginBasDt", from.format(BASIC))
				.queryParam("endBasDt", to.plusDays(1).format(BASIC)) // endBasDt 는 미만 조건
				.queryParam("numOfRows", 1000)
				.queryParam("pageNo", 1)
				.encode()
				.build()
				.toUri();
		try {
			String body = restClient.get().uri(uri).header("Accept", "*/*").retrieve().body(String.class);
			return parse(body, instrument.getSymbol());
		}
		catch (RestClientResponseException e) {
			// 포털 오류 본문의 errMsg(예: SERVICE_KEY_IS_NOT_REGISTERED_ERROR)만 남기고, 키가 든 URL 은 남기지 않음
			String errMsg = objectMapper.readTree(e.getResponseBodyAsString().isBlank() ? "{}" : e.getResponseBodyAsString())
					.path("OpenAPI_ServiceResponse").path("cmmMsgHeader").path("errMsg").asString("");
			log.warn("시세 조회 실패 ({} {}): HTTP {} {}", instrument.getSymbol(), instrument.getName(),
					e.getStatusCode().value(), errMsg);
			return List.of();
		}
		catch (Exception e) {
			// 인증키가 포함된 URL 은 남기지 않음
			log.warn("시세 조회 실패 ({} {}): {}", instrument.getSymbol(), instrument.getName(), e.getClass().getSimpleName());
			return List.of();
		}
	}

	List<Bar> parse(String body, String symbol) {
		if (body == null || body.isBlank() || !body.trim().startsWith("{")) {
			log.warn("시세 응답 형식 오류 ({}): JSON 이 아님 — 인증키·활용신청 승인 여부를 확인하세요.", symbol);
			return List.of();
		}
		JsonNode root = objectMapper.readTree(body);
		JsonNode header = root.path("response").path("header");
		String resultCode = header.path("resultCode").asString("");
		if (!"00".equals(resultCode)) {
			log.warn("시세 API 오류 ({}): {} {}", symbol, resultCode, header.path("resultMsg").asString(""));
			return List.of();
		}
		JsonNode items = root.path("response").path("body").path("items").path("item");
		List<JsonNode> rows = new ArrayList<>();
		if (items.isArray()) {
			items.forEach(rows::add);
		}
		else if (items.isObject()) {
			rows.add(items);
		}
		List<Bar> bars = new ArrayList<>();
		for (JsonNode row : rows) {
			if (!symbol.equals(row.path("srtnCd").asString(""))) {
				continue; // likeSrtnCd 는 포함 검색이라 정확히 일치하는 것만
			}
			bars.add(new Bar(
					LocalDate.parse(row.path("basDt").asString(), BASIC),
					parseLong(row, "clpr"),
					parseLong(row, "vs"),
					parseDouble(row, "fltRt"),
					parseLong(row, "trqu"),
					parseLong(row, "trPrc"),
					row.has("mrktTotAmt") ? parseLong(row, "mrktTotAmt") : null));
		}
		bars.sort(Comparator.comparing(Bar::date));
		return bars;
	}

	private static long parseLong(JsonNode row, String field) {
		String text = row.path(field).asString("0").trim();
		return text.isEmpty() ? 0 : Math.round(Double.parseDouble(text));
	}

	private static Double parseDouble(JsonNode row, String field) {
		String text = row.path(field).asString("").trim();
		return text.isEmpty() ? null : Double.valueOf(text);
	}

	/** 공공데이터 한 행: 기준일, 종가, 전일 대비, 등락률(%), 거래량, 거래대금, 시가총액 */
	public record Bar(LocalDate date, long close, long change, Double changePercent, long volume,
			long tradingValue, Long marketCap) {

		Instrument.Quote toQuote() {
			return new Instrument.Quote(date, close, change, changePercent, volume, tradingValue, marketCap);
		}
	}
}
