package com.ganum.market;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ganum.common.api.ApiResponse;
import com.ganum.common.api.ListData;
import com.ganum.market.dto.InstrumentDetail;
import com.ganum.market.dto.InstrumentItem;
import com.ganum.market.dto.PriceChart;

@RestController
@RequestMapping("/api/v1/instruments")
public class MarketController {

	private final MarketService marketService;

	public MarketController(MarketService marketService) {
		this.marketService = marketService;
	}

	/** MARKET-01 · 종목 검색·랭킹 */
	@GetMapping
	public ApiResponse<ListData<InstrumentItem>> search(
			@RequestParam(required = false) String query,
			@RequestParam(required = false) Instrument.Type type,
			@RequestParam(required = false) MarketService.Sort sort,
			@RequestParam(required = false) String cursor,
			@RequestParam(required = false) Integer limit) {
		var result = marketService.search(query, type, sort, cursor, limit);
		return ApiResponse.of(result.data(), result.meta());
	}

	/** MARKET-02 · 종목 상세 */
	@GetMapping("/{instrumentId}")
	public ApiResponse<InstrumentDetail> detail(@PathVariable String instrumentId) {
		var result = marketService.detail(instrumentId);
		return ApiResponse.of(result.data(), result.meta());
	}

	/** MARKET-03 · 종목 차트 */
	@GetMapping("/{instrumentId}/prices")
	public ApiResponse<PriceChart> prices(
			@PathVariable String instrumentId,
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
			@RequestParam(required = false) MarketService.Interval interval) {
		var result = marketService.prices(instrumentId, from, to, interval);
		return ApiResponse.of(result.data(), result.meta());
	}
}
