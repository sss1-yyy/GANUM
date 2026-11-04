package com.ganum.common;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** 금액·비율 계산 도우미. 금액은 원 단위 반올림, 비율은 소수 첫째 자리 반올림(12.5 = 12.5%). */
public final class Numbers {

	private Numbers() {
	}

	public static long roundWon(BigDecimal amount) {
		return amount.setScale(0, RoundingMode.HALF_UP).longValueExact();
	}

	/** part / whole × 100. whole 이 0 이하면 null */
	public static Double percent(long part, long whole) {
		if (whole <= 0) {
			return null;
		}
		return BigDecimal.valueOf(part).multiply(BigDecimal.valueOf(100))
				.divide(BigDecimal.valueOf(whole), 1, RoundingMode.HALF_UP).doubleValue();
	}

	/** 비중용: whole 이 0 이면 0 */
	public static double weight(long part, long whole) {
		Double p = percent(part, whole);
		return p == null ? 0 : p;
	}

	/** 수량·단가 문자열 표현 (불필요한 0 제거, 지수 표기 없음) */
	public static String plain(BigDecimal value) {
		if (value == null) {
			return null;
		}
		BigDecimal stripped = value.stripTrailingZeros();
		return stripped.scale() < 0 ? stripped.setScale(0).toPlainString() : stripped.toPlainString();
	}
}
