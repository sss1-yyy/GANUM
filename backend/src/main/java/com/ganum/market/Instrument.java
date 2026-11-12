package com.ganum.market;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import com.ganum.common.api.Meta.DataSource;

/** 종목 + 최신 시세. 가격은 원 단위 정수. */
@Entity
@Table(name = "instruments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Instrument {

	public enum Type { STOCK, ETF }

	/** 내부 종목 ID. 예: ins_005930 */
	@Id
	@Column(length = 30)
	private String id;

	@Column(nullable = false, length = 12)
	private String symbol;

	@Column(nullable = false, length = 50)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private Type type;

	@Column(nullable = false, length = 10)
	private String market;

	@Column(nullable = false)
	private long price;

	@Column(nullable = false)
	private long changeAmount;

	/** 직전 종가가 없으면 null */
	private Double changePercent;

	@Column(nullable = false)
	private long volume;

	@Column(nullable = false)
	private long tradingValue;

	private Long marketCap;
	private Long high52Week;
	private Long low52Week;

	/** 시세 기준 거래일 */
	@Column(nullable = false)
	private LocalDate quoteDate;

	/** MOCK: 시드 값, LIVE: 공공데이터포털에서 받은 값 */
	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private DataSource quoteSource;

	public Instrument(String symbol, String name, Type type) {
		this.id = "ins_" + symbol;
		this.symbol = symbol;
		this.name = name;
		this.type = type;
		this.market = "KRX";
	}

	public void updateQuote(Quote quote, DataSource source) {
		this.price = quote.price();
		this.changeAmount = quote.changeAmount();
		this.changePercent = quote.changePercent();
		this.volume = quote.volume();
		this.tradingValue = quote.tradingValue();
		if (quote.marketCap() != null) {
			this.marketCap = quote.marketCap();
		}
		this.quoteDate = quote.date();
		this.quoteSource = source;
	}

	public void updateRange52Week(Long high, Long low) {
		this.high52Week = high;
		this.low52Week = low;
	}

	/** 한 거래일의 시세 값 묶음 */
	public record Quote(LocalDate date, long price, long changeAmount, Double changePercent, long volume,
			long tradingValue, Long marketCap) {
	}
}
