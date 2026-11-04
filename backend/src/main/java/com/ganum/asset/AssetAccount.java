package com.ganum.asset;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 입출금(CASH)·예적금(DEPOSIT) 등 잔액형 자산. 자산 연동처가 미정이라 시드 값입니다. */
@Entity
@Table(name = "asset_accounts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AssetAccount {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long userId;

	@Column(nullable = false, length = 50)
	private String institution;

	@Column(nullable = false, length = 50)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private AssetCategory category;

	@Column(nullable = false)
	private long balance;

	/** 예적금(DEPOSIT)만: 연 이율(%) */
	private Double interestRate;

	/** 예적금만: 가입 기간(개월). 기간 없는 통장은 null */
	private Integer termMonths;

	/** 예적금만: 월 납입액. 정기 납입이 아니면 null */
	private Long monthlyDeposit;

	public AssetAccount(Long userId, String institution, String name, AssetCategory category, long balance) {
		this.userId = userId;
		this.institution = institution;
		this.name = name;
		this.category = category;
		this.balance = balance;
	}

	public static AssetAccount deposit(Long userId, String institution, String name, long balance,
			double interestRate, Integer termMonths, Long monthlyDeposit) {
		AssetAccount a = new AssetAccount(userId, institution, name, AssetCategory.DEPOSIT, balance);
		a.interestRate = interestRate;
		a.termMonths = termMonths;
		a.monthlyDeposit = monthlyDeposit;
		return a;
	}
}
