package com.ganum.seed;

import java.time.Clock;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.ganum.usage.UsageAccount;
import com.ganum.usage.UsageAccountRepository;
import com.ganum.user.FinancialProfile;
import com.ganum.user.FinancialProfileRepository;
import com.ganum.user.User;
import com.ganum.user.UserRepository;

/**
 * 데모 사용자와 기본 데이터를 넣습니다. 이미 있으면 건너뛰므로 여러 번 실행해도 안전해요.
 * 값은 프론트 목데이터(frontend/src/mocks/shared)와 맞춘 예시입니다.
 */
@Component
public class DemoDataSeeder {

	private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

	private final UserRepository userRepository;
	private final FinancialProfileRepository financialProfileRepository;
	private final UsageAccountRepository usageAccountRepository;
	private final Clock clock;
	private final String demoLoginId;

	public DemoDataSeeder(UserRepository userRepository, FinancialProfileRepository financialProfileRepository,
			UsageAccountRepository usageAccountRepository, Clock clock,
			@Value("${ganum.auth.demo-login-id}") String demoLoginId) {
		this.userRepository = userRepository;
		this.financialProfileRepository = financialProfileRepository;
		this.usageAccountRepository = usageAccountRepository;
		this.clock = clock;
		this.demoLoginId = demoLoginId;
	}

	@Transactional
	public void seed() {
		Instant now = clock.instant();
		User user = userRepository.findByLoginId(demoLoginId)
				.orElseGet(() -> userRepository.save(new User(demoLoginId, "서연", now)));
		Long userId = user.getId();

		if (!financialProfileRepository.existsById(userId)) {
			financialProfileRepository.save(new FinancialProfile(userId, 2003,
					FinancialProfile.Occupation.STUDENT, FinancialProfile.HousingType.RENT, "11",
					1_100_000L, 800_000L, 0L, 1_500_000L, now));
		}
		if (!usageAccountRepository.existsById(userId)) {
			usageAccountRepository.save(new UsageAccount(userId, UsageAccount.Plan.FREE, 10, 4, null));
		}
		log.info("데모 데이터 준비 완료 (userId={})", userId);
	}
}
