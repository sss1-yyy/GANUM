package com.ganum.asset;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ganum.asset.dto.AssetDetailDtos;
import com.ganum.asset.dto.AssetHistoryPoint;
import com.ganum.asset.dto.AssetSummaryResponse;
import com.ganum.asset.dto.HoldingItem;
import com.ganum.common.api.ApiResponse;
import com.ganum.common.api.ListData;
import com.ganum.common.auth.CurrentUserId;

@RestController
@RequestMapping("/api/v1/assets")
public class AssetController {

	private final AssetService assetService;
	private final AssetSeeder assetSeeder;

	public AssetController(AssetService assetService, AssetSeeder assetSeeder) {
		this.assetService = assetService;
		this.assetSeeder = assetSeeder;
	}

	/** ASSET-01 · 실제 자산 요약 */
	@GetMapping("/summary")
	public ApiResponse<AssetSummaryResponse> summary(@CurrentUserId Long userId) {
		var r = assetService.summary(userId);
		return ApiResponse.of(r.data(), r.meta());
	}

	/** ASSET-03 · 실제 투자 보유 목록 */
	@GetMapping("/holdings")
	public ApiResponse<ListData<HoldingItem>> holdings(@CurrentUserId Long userId,
			@RequestParam(required = false) String cursor, @RequestParam(required = false) Integer limit) {
		var r = assetService.holdings(userId, cursor, limit);
		return ApiResponse.of(r.data(), r.meta());
	}

	/** [명세 외] 계좌 목록 (docs/figma-api-gaps.md "내 자산") */
	@GetMapping("/accounts")
	public ApiResponse<AssetDetailDtos.Accounts> accounts(@CurrentUserId Long userId) {
		var r = assetService.accounts(userId);
		return ApiResponse.of(r.data(), r.meta());
	}

	/** [명세 외] 예적금 상세 */
	@GetMapping("/savings")
	public ApiResponse<AssetDetailDtos.CategoryDetail<AssetDetailDtos.Savings>> savings(@CurrentUserId Long userId) {
		var r = assetService.savings(userId);
		return ApiResponse.of(r.data(), r.meta());
	}

	/** [명세 외] 코인 상세 */
	@GetMapping("/crypto")
	public ApiResponse<AssetDetailDtos.CategoryDetail<AssetDetailDtos.Crypto>> crypto(@CurrentUserId Long userId) {
		var r = assetService.crypto(userId);
		return ApiResponse.of(r.data(), r.meta());
	}

	/**
	 * [명세 외] 금융기관 연결하기. 자산 연동처가 미정이라 예시 자산을 연결된 상태로 만들고 자산 요약(ASSET-01)을 돌려줍니다.
	 * 이미 연결돼 있으면 그대로 요약만 돌려줍니다.
	 */
	@PostMapping("/connections")
	@ResponseStatus(HttpStatus.CREATED)
	public ApiResponse<AssetSummaryResponse> connect(@CurrentUserId Long userId) {
		assetSeeder.connect(userId);
		var r = assetService.summary(userId);
		return ApiResponse.of(r.data(), r.meta());
	}

	/** ASSET-04 · 자산 추이 */
	@GetMapping("/history")
	public ApiResponse<ListData<AssetHistoryPoint>> history(@CurrentUserId Long userId,
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
			@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
		var r = assetService.history(userId, from, to);
		return ApiResponse.of(r.data(), r.meta());
	}
}
