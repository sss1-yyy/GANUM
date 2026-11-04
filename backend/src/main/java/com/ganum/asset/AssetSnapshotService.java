package com.ganum.asset;

import java.time.Clock;
import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ganum.user.User;
import com.ganum.user.UserRepository;

/** 매일 밤 사용자별 자산 총액을 기록합니다 (자산 추이·월간 변화의 원천). */
@Service
public class AssetSnapshotService {

	private static final Logger log = LoggerFactory.getLogger(AssetSnapshotService.class);

	private final UserRepository userRepository;
	private final AssetValuationService valuationService;
	private final AssetSnapshotRepository snapshotRepository;
	private final Clock clock;

	public AssetSnapshotService(UserRepository userRepository, AssetValuationService valuationService,
			AssetSnapshotRepository snapshotRepository, Clock clock) {
		this.userRepository = userRepository;
		this.valuationService = valuationService;
		this.snapshotRepository = snapshotRepository;
		this.clock = clock;
	}

	@Scheduled(cron = "0 55 23 * * *", zone = "Asia/Seoul")
	public void recordAll() {
		for (User user : userRepository.findAll()) {
			record(user.getId());
		}
		log.info("자산 스냅샷 기록 완료");
	}

	@Transactional
	public void record(Long userId) {
		var v = valuationService.valuate(userId);
		if (!v.connected()) {
			return;
		}
		LocalDate today = LocalDate.now(clock);
		snapshotRepository.findByUserIdAndDate(userId, today).ifPresentOrElse(
				s -> s.update(v.totalAssets(), v.totalDebt()),
				() -> snapshotRepository.save(new AssetSnapshot(userId, today, v.totalAssets(), v.totalDebt())));
	}
}
