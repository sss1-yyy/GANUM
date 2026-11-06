package com.ganum.asset;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.http.HttpClient;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * 업비트 공개 시세 API (인증키 불필요, 무료). KRW 마켓 현재가(원)와 24시간 등락률을 반환합니다.
 * 요청 제한을 지키기 위해 30초 동안 결과를 재사용합니다.
 */
@Component
public class UpbitPriceClient {

	private static final Logger log = LoggerFactory.getLogger(UpbitPriceClient.class);
	private static final Duration CACHE_TTL = Duration.ofSeconds(30);

	private final CryptoProperties properties;
	private final ObjectMapper objectMapper;
	private final Clock clock;
	private final RestClient restClient;
	private final Map<String, Cached> cache = new ConcurrentHashMap<>();

	public UpbitPriceClient(CryptoProperties properties, ObjectMapper objectMapper, Clock clock) {
		this.properties = properties;
		this.objectMapper = objectMapper;
		this.clock = clock;
		HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();
		JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
		factory.setReadTimeout(Duration.ofSeconds(3));
		this.restClient = RestClient.builder().baseUrl("https://api.upbit.com").requestFactory(factory).build();
	}

	/** symbol(예: BTC) → 시세. 조회 실패한 심볼은 결과에 없습니다. */
	public Map<String, Ticker> tickers(Collection<String> symbols) {
		if (!properties.upbitEnabled() || symbols.isEmpty()) {
			return Map.of();
		}
		Instant now = clock.instant();
		Map<String, Ticker> result = new HashMap<>();
		for (String s : symbols) {
			Cached c = cache.get(s);
			if (c != null && c.at.plus(CACHE_TTL).isAfter(now)) {
				result.put(s, c.ticker);
			}
		}
		var missing = symbols.stream().filter(s -> !result.containsKey(s)).distinct().toList();
		if (missing.isEmpty()) {
			return result;
		}
		String markets = missing.stream().map(s -> "KRW-" + s).collect(Collectors.joining(","));
		try {
			String body = restClient.get().uri(uri -> uri.path("/v1/ticker").queryParam("markets", markets).build())
					.retrieve().body(String.class);
			JsonNode array = objectMapper.readTree(body);
			for (JsonNode row : array) {
				String symbol = row.path("market").asString("").replace("KRW-", "");
				long price = Math.round(row.path("trade_price").asDouble());
				// signed_change_rate: 전일(09:00 KST 기준) 대비 비율. 0.0123 → 1.2%
				double changePercent = BigDecimal.valueOf(row.path("signed_change_rate").asDouble())
						.multiply(BigDecimal.valueOf(100)).setScale(1, RoundingMode.HALF_UP).doubleValue();
				Ticker ticker = new Ticker(price, changePercent);
				result.put(symbol, ticker);
				cache.put(symbol, new Cached(ticker, now));
			}
		}
		catch (Exception e) {
			log.warn("업비트 시세 조회 실패: {}", e.getClass().getSimpleName());
		}
		return result;
	}

	public record Ticker(long price, double changePercent) {
	}

	private record Cached(Ticker ticker, Instant at) {
	}
}
