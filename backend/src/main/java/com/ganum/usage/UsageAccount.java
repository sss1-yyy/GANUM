package com.ganum.usage;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 사용자별 서비스 토큰(이용권) 잔액. 잔액 = 지급량 - 사용량. */
@Entity
@Table(name = "usage_accounts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UsageAccount {

	public enum Plan { FREE, PAID }

	@Id
	private Long userId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private Plan plan;

	@Column(nullable = false)
	private int tokensGranted;

	@Column(nullable = false)
	private int tokensUsed;

	/** 다음 정기 지급 시각. 정책 미정이라 null 허용. */
	private Instant resetsAt;

	/** 동시에 두 요청이 차감할 때 잔액이 꼬이지 않도록 낙관적 락. */
	@Version
	private long version;

	public UsageAccount(Long userId, Plan plan, int tokensGranted, int tokensUsed, Instant resetsAt) {
		this.userId = userId;
		this.plan = plan;
		this.tokensGranted = tokensGranted;
		this.tokensUsed = tokensUsed;
		this.resetsAt = resetsAt;
	}

	public int getTokenBalance() {
		return tokensGranted - tokensUsed;
	}

	/** 잔액이 충분하면 차감하고 true, 부족하면 아무것도 안 하고 false. */
	boolean tryCharge(int cost) {
		if (getTokenBalance() < cost) {
			return false;
		}
		tokensUsed += cost;
		return true;
	}

	/** AI 생성 실패 등으로 차감을 되돌릴 때. */
	void refund(int cost) {
		tokensUsed = Math.max(0, tokensUsed - cost);
	}
}
