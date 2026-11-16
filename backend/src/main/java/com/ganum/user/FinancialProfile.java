package com.ganum.user;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 재정정보(USER-02 구조). 조회·수정 API 는 목데이터 범위라 서버에선 시드 값만 두고,
 * /me 의 onboardingCompleted 와 레포트 생성의 입력으로 사용합니다. 금액은 원 단위.
 */
@Entity
@Table(name = "financial_profiles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FinancialProfile {

	public enum Occupation { STUDENT, EMPLOYEE, OTHER }

	public enum HousingType { FAMILY, RENT, OWN, OTHER }

	@Id
	private Long userId;

	private Integer birthYear;

	@Enumerated(EnumType.STRING)
	@Column(length = 20)
	private Occupation occupation;

	@Enumerated(EnumType.STRING)
	@Column(length = 20)
	private HousingType housingType;

	@Column(length = 20)
	private String regionCode;

	private Long monthlyIncome;
	private Long monthlyExpense;
	private Long debtAmount;
	private Long emergencyFund;

	@Column(nullable = false)
	private Instant updatedAt;

	public FinancialProfile(Long userId, Integer birthYear, Occupation occupation, HousingType housingType,
			String regionCode, Long monthlyIncome, Long monthlyExpense, Long debtAmount, Long emergencyFund,
			Instant updatedAt) {
		this.userId = userId;
		this.birthYear = birthYear;
		this.occupation = occupation;
		this.housingType = housingType;
		this.regionCode = regionCode;
		this.monthlyIncome = monthlyIncome;
		this.monthlyExpense = monthlyExpense;
		this.debtAmount = debtAmount;
		this.emergencyFund = emergencyFund;
		this.updatedAt = updatedAt;
	}

	/** 레포트 생성에 꼭 필요한 값(나이·직업·월소득·월지출)이 모두 입력됐는지. */
	public boolean isOnboardingCompleted() {
		return birthYear != null && occupation != null && monthlyIncome != null && monthlyExpense != null;
	}
}
