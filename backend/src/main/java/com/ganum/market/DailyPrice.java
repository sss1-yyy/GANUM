package com.ganum.market;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 종목의 일별 종가·거래량 (차트용). */
@Entity
@Table(name = "daily_prices",
		uniqueConstraints = @UniqueConstraint(columnNames = { "instrument_id", "trade_date" }),
		indexes = @Index(columnList = "instrument_id, trade_date"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DailyPrice {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "instrument_id", nullable = false, length = 30)
	private String instrumentId;

	@Column(name = "trade_date", nullable = false)
	private LocalDate date;

	@Column(nullable = false)
	private long close;

	@Column(nullable = false)
	private long volume;

	public DailyPrice(String instrumentId, LocalDate date, long close, long volume) {
		this.instrumentId = instrumentId;
		this.date = date;
		this.close = close;
		this.volume = volume;
	}
}
