package com.ganum.notification;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 알림 발생 조건 (명세상 "팀 확정 필요" → 기본값은 예시).
 * @param priceChangePercent 보유 종목 전일 대비 등락률 절댓값이 이 이상이면 PRICE_CHANGE
 * @param concentrationPercent 한 종목이 실제 투자자산의 이 비중 이상이면 PORTFOLIO_RISK
 * @param benefitDeadlineDays 혜택 마감 며칠 전부터 BENEFIT_DEADLINE
 */
@ConfigurationProperties(prefix = "ganum.notification")
public record NotificationProperties(double priceChangePercent, double concentrationPercent,
		int benefitDeadlineDays) {

	public NotificationProperties {
		// 설정이 빠져 0 이 되면 모든 종목에 알림이 생기므로 시작 단계에서 막습니다
		if (priceChangePercent <= 0 || concentrationPercent <= 0 || benefitDeadlineDays <= 0) {
			throw new IllegalStateException("ganum.notification.* 설정이 필요해요.");
		}
	}
}
