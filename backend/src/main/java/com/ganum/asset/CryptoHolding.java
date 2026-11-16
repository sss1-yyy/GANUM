package com.ganum.asset;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 코인 보유. 가격은 업비트 KRW 마켓 현재가, 조회 실패 시 fallbackPrice. */
@Entity
@Table(name = "crypto_holdings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CryptoHolding {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long userId;

	/** 예: BTC */
	@Column(nullable = false, length = 20)
	private String symbol;

	@Column(nullable = false, length = 50)
	private String name;

	@Column(nullable = false, precision = 30, scale = 10)
	private BigDecimal quantity;

	/** 시드 기준 가격(원). 업비트 조회 실패 시 사용 */
	@Column(nullable = false)
	private long fallbackPrice;

	/** 시드 기준 24시간 등락률(%). 업비트 조회 실패 시 사용 */
	@Column(nullable = false)
	private double fallbackChangePercent;

	public CryptoHolding(Long userId, String symbol, String name, BigDecimal quantity, long fallbackPrice,
			double fallbackChangePercent) {
		this.userId = userId;
		this.symbol = symbol;
		this.name = name;
		this.quantity = quantity;
		this.fallbackPrice = fallbackPrice;
		this.fallbackChangePercent = fallbackChangePercent;
	}
}
