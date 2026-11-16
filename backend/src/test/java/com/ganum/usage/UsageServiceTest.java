package com.ganum.usage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.ganum.common.error.ApiException;
import com.ganum.common.error.ErrorCode;
import com.ganum.user.UserRepository;

@SpringBootTest
@Transactional // 테스트마다 차감 내역을 되돌림
@DisplayName("서비스 토큰 차감")
class UsageServiceTest {

	@Autowired
	UsageService usageService;

	@Autowired
	UserRepository userRepository;

	private Long demoUserId() {
		return userRepository.findByLoginId("demo").orElseThrow().getId();
	}

	@Test
	@DisplayName("레포트 1회 → 3토큰 차감 (잔액 6 → 3)")
	void chargeReport() {
		Long userId = demoUserId();
		int charged = usageService.charge(userId, UsageFeature.REPORT);

		assertThat(charged).isEqualTo(3);
		assertThat(usageService.getUsage(userId).tokenBalance()).isEqualTo(3);
	}

	@Test
	@DisplayName("잔액이 모자라면 409 TOKEN_INSUFFICIENT, 잔액은 그대로")
	void insufficient() {
		Long userId = demoUserId();
		usageService.charge(userId, UsageFeature.REPORT);
		usageService.charge(userId, UsageFeature.REPORT); // 잔액 0

		assertThatThrownBy(() -> usageService.charge(userId, UsageFeature.CHAT))
				.isInstanceOf(ApiException.class)
				.extracting(e -> ((ApiException) e).code())
				.isEqualTo(ErrorCode.TOKEN_INSUFFICIENT);
		assertThat(usageService.getUsage(userId).tokenBalance()).isZero();
	}

	@Test
	@DisplayName("생성 실패 시 환불하면 잔액 복구")
	void refund() {
		Long userId = demoUserId();
		int charged = usageService.charge(userId, UsageFeature.REPORT);
		usageService.refund(userId, charged);

		assertThat(usageService.getUsage(userId).tokenBalance()).isEqualTo(6);
	}
}
