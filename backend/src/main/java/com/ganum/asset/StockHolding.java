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

/** 실제 증권 계좌의 보유 종목(주식·ETF). 평가액은 종목 시세로 계산합니다. */
@Entity
@Table(name = "stock_holdings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StockHolding {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long userId;

	@Column(nullable = false, length = 30)
	private String instrumentId;

	/** 실제 보유는 소수 수량 가능 */
	@Column(nullable = false, precision = 24, scale = 8)
	private BigDecimal quantity;

	/** KRW 평균 매입가. 원천 미제공이면 null */
	@Column(precision = 24, scale = 4)
	private BigDecimal averagePrice;

	public StockHolding(Long userId, String instrumentId, BigDecimal quantity, BigDecimal averagePrice) {
		this.userId = userId;
		this.instrumentId = instrumentId;
		this.quantity = quantity;
		this.averagePrice = averagePrice;
	}
}
