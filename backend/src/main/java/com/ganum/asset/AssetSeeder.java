package com.ganum.asset;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import com.ganum.user.UserRepository;

/**
 * 데모 사용자의 실제 자산 시드. 값은 프론트 목데이터(features/assets/mocks)와 같은 Figma 기준입니다.
 * 입출금 3,500,000 + 예적금 11,000,000 + 증권(시세 평가) + 코인(업비트 시세 평가)
 */
@Component
public class AssetSeeder {

	private static final Logger log = LoggerFactory.getLogger(AssetSeeder.class);
	private static final int BACKFILL_DAYS = 400;

	private final UserRepository userRepository;
	private final AssetAccountRepository accountRepository;
	private final StockHoldingRepository stockHoldingRepository;
	private final CryptoHoldingRepository cryptoHoldingRepository;
	private final AssetSnapshotRepository snapshotRepository;
	private final AssetValuationService valuationService;
	private final TransactionTemplate tx;
	private final Clock clock;
	private final String demoLoginId;

	public AssetSeeder(UserRepository userRepository, AssetAccountRepository accountRepository,
			StockHoldingRepository stockHoldingRepository, CryptoHoldingRepository cryptoHoldingRepository,
			AssetSnapshotRepository snapshotRepository, AssetValuationService valuationService,
			TransactionTemplate tx, Clock clock, @Value("${ganum.auth.demo-login-id}") String demoLoginId) {
		this.userRepository = userRepository;
		this.accountRepository = accountRepository;
		this.stockHoldingRepository = stockHoldingRepository;
		this.cryptoHoldingRepository = cryptoHoldingRepository;
		this.snapshotRepository = snapshotRepository;
		this.valuationService = valuationService;
		this.tx = tx;
		this.clock = clock;
		this.demoLoginId = demoLoginId;
	}

	public void seed() {
		Long userId = userRepository.findByLoginId(demoLoginId).orElseThrow().getId();
		tx.executeWithoutResult(status -> seedFor(userId));
	}

	/** [명세 외] 금융기관 연결하기 — 트랜잭션 안에서 seedFor 실행 */
	public boolean connect(Long userId) {
		return Boolean.TRUE.equals(tx.execute(status -> seedFor(userId)));
	}

	/**
	 * 사용자에게 예시 자산을 넣습니다. 이미 있으면 아무것도 하지 않아요.
	 * [명세 외] POST /assets/connections("금융기관 연결하기")도 연동처가 정해지기 전까지 이 메서드를 씁니다.
	 * @return 새로 넣었으면 true
	 */
	public boolean seedFor(Long userId) {
		boolean created = false;
		if (!accountRepository.existsByUserId(userId)) {
			accountRepository.saveAll(List.of(
					new AssetAccount(userId, "카카오뱅크", "입출금통장", AssetCategory.CASH, 1_500_000),
					new AssetAccount(userId, "토스뱅크", "토스뱅크 통장", AssetCategory.CASH, 1_200_000),
					new AssetAccount(userId, "하나은행", "급여하나 통장", AssetCategory.CASH, 800_000),
					AssetAccount.deposit(userId, "IBK기업은행", "청년도약계좌", 4_200_000, 4.5, 60, 700_000L),
					AssetAccount.deposit(userId, "KB국민은행", "정기예금", 3_000_000, 3.2, 12, null),
					AssetAccount.deposit(userId, "신한은행", "자유적금", 2_300_000, 3.8, 6, null),
					AssetAccount.deposit(userId, "카카오뱅크", "비상금 통장", 1_500_000, 2.0, null, null)));
			stockHoldingRepository.saveAll(List.of(
					holding(userId, "ins_005930", "11", "271921"),
					holding(userId, "ins_000660", "1", "1833665"),
					holding(userId, "ins_042700", "1", "1556762"),
					holding(userId, "ins_069500", "5", "282306")));
			cryptoHoldingRepository.saveAll(List.of(
					new CryptoHolding(userId, "BTC", "비트코인", new BigDecimal("0.008"), 67_500_000, -3.2),
					new CryptoHolding(userId, "ETH", "이더리움", new BigDecimal("0.12"), 2_500_000, -5.1),
					new CryptoHolding(userId, "XRP", "리플", new BigDecimal("100"), 1_400, -1.8),
					new CryptoHolding(userId, "SOL", "솔라나", new BigDecimal("0.5"), 160_000, -4.6)));
			log.info("실제 자산 시드 생성 (userId={})", userId);
			created = true;
		}
		if (!snapshotRepository.existsByUserId(userId)) {
			backfillHistory(userId);
		}
		return created;
	}

	/** 과거 자산 기록이 없으므로, 현재 평가액을 기준으로 완만하게 변하는 예시 기록을 채웁니다. (프론트 목과 같은 공식) */
	private void backfillHistory(Long userId) {
		var v = valuationService.valuate(userId);
		LocalDate today = LocalDate.now(clock);
		List<AssetSnapshot> rows = new ArrayList<>();
		for (int daysAgo = BACKFILL_DAYS; daysAgo >= 1; daysAgo--) {
			double factor = 1 - daysAgo * 0.0007 + Math.sin(daysAgo / 2.3) * 0.004;
			long total = Math.round(v.totalAssets() * factor / 1000.0) * 1000;
			rows.add(new AssetSnapshot(userId, today.minusDays(daysAgo), Math.max(total, 0), v.totalDebt()));
		}
		snapshotRepository.saveAll(rows);
		log.info("자산 추이 예시 기록 {}일치 생성", rows.size());
	}

	private static StockHolding holding(Long userId, String instrumentId, String qty, String avg) {
		return new StockHolding(userId, instrumentId, new BigDecimal(qty), new BigDecimal(avg));
	}
}
