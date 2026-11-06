package com.ganum.notification;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import com.ganum.benefit.Benefit;
import com.ganum.benefit.BenefitRepository;
import com.ganum.user.UserRepository;

/**
 * 혜택 마감일 시드 + 환영 알림, 그리고 시작 시 알림 조건을 한 번 점검합니다.
 * 혜택 ID·제목·마감 간격은 프론트 목데이터(mocks/shared/user.ts)와 같습니다.
 */
@Component
public class NotificationSeeder {

	private final UserRepository userRepository;
	private final BenefitRepository benefitRepository;
	private final NotificationService notificationService;
	private final NotificationGenerator generator;
	private final TransactionTemplate tx;
	private final Clock clock;
	private final String demoLoginId;

	public NotificationSeeder(UserRepository userRepository, BenefitRepository benefitRepository,
			NotificationService notificationService, NotificationGenerator generator, TransactionTemplate tx,
			Clock clock, @Value("${ganum.auth.demo-login-id}") String demoLoginId) {
		this.userRepository = userRepository;
		this.benefitRepository = benefitRepository;
		this.notificationService = notificationService;
		this.generator = generator;
		this.tx = tx;
		this.clock = clock;
		this.demoLoginId = demoLoginId;
	}

	public void seed() {
		tx.executeWithoutResult(status -> {
			if (benefitRepository.count() == 0) {
				LocalDate today = LocalDate.now(clock);
				List<Benefit> seeds = new ArrayList<>();
				seeds.add(new Benefit("ben_youth_leap", "청년도약계좌", today.plusDays(5)));
				seeds.add(new Benefit("ben_youth_rent", "청년 월세 지원", today.plusDays(30)));
				seeds.add(new Benefit("ben_transit", "대중교통비 환급", null));
				seeds.add(new Benefit("ben_culture", "청년 문화패스", today.plusDays(45)));
				seeds.add(new Benefit("ben_housing_savings", "청년주택드림청약통장", today.plusDays(23)));
				seeds.add(new Benefit("ben_learning_card", "국민내일배움카드", today.plusDays(60)));
				benefitRepository.saveAll(seeds);
			}
		});
		Long userId = userRepository.findByLoginId(demoLoginId).orElseThrow().getId();
		notificationService.publish(userId, Notification.Type.SYSTEM, "가늠에 오신 걸 환영해요",
				"내 자산을 한눈에 보고, AI 코치에게 궁금한 점을 물어보세요.",
				Notification.TargetType.HOME, null, "SYSTEM:WELCOME");
		generator.generateFor(userId);
	}
}
