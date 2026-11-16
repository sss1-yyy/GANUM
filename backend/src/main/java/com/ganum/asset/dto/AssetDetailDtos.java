package com.ganum.asset.dto;

import java.util.List;

/**
 * [명세 외] 내 자산 상세 화면용 응답. API 명세서에는 없고, 프론트(features/assets/types.ts)와
 * docs/figma-api-gaps.md 의 "내 자산" 제안을 그대로 따릅니다. 명세에 반영되면 여기를 맞춰 고칩니다.
 */
public final class AssetDetailDtos {

	private AssetDetailDtos() {
	}

	/** GET /assets/accounts 항목. type: CASH(입출금) / STOCK(증권 계좌) */
	public record Account(String id, String institution, String name, long balance, String type) {
	}

	public record Accounts(List<Account> items) {
	}

	/** GET /assets/savings 항목 */
	public record Savings(String id, String name, long balance, Double interestRate, Integer termMonths,
			Long monthlyDeposit) {
	}

	/** GET /assets/crypto 항목. quantity 는 소수 정밀도 때문에 문자열 */
	public record Crypto(String id, String name, String symbol, String quantity, long amount, double changePercent) {
	}

	/** 카테고리 상세 공통: 합계 + 지난달 대비 + 항목 */
	public record CategoryDetail<T>(long totalAmount, Long monthlyChangeAmount, List<T> items) {
	}
}
