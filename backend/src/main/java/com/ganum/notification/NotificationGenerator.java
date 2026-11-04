package com.ganum.notification;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.IsoFields;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.ganum.asset.AssetValuationService;
import com.ganum.asset.AssetValuationService.PricedHolding;
import com.ganum.benefit.Benefit;
import com.ganum.benefit.BenefitRepository;
import com.ganum.common.Numbers;
import com.ganum.market.Instrument;
import com.ganum.market.MarketSyncedEvent;
import com.ganum.notification.Notification.TargetType;
import com.ganum.notification.Notification.Type;
import com.ganum.user.User;
import com.ganum.user.UserRepository;

/**
 * 알림 생성 스케줄러. 같은 사건은 dedupKey 로 한 번만 알립니다.
 * 문구는 투자 권유로 보이지 않게 사실만 전달합니다.
 */
@Service
public class NotificationGenerator {

	private static final Logger log = LoggerFactory.getLogger(NotificationGenerator.class);

	private final UserRepository userRepository;
	private final AssetValuationService valuationService;
	private final BenefitRepository benefitRepository;
	private final NotificationService notificationService;
	private final NotificationProperties properties;
	private final Clock clock;

	public NotificationGenerator(UserRepository userRepository, AssetValuationService valuationService,
			BenefitRepository benefitRepository, NotificationService notificationService,
			NotificationProperties properties, Clock clock) {
		this.userRepository = userRepository;
		this.valuationService = valuationService;
		this.benefitRepository = benefitRepository;
		this.notificationService = notificationService;
		this.properties = properties;
		this.clock = clock;
	}

	/** 매일 아침 + 시세 갱신 이후 */
	@Scheduled(cron = "0 0 8,14,19 * * *", zone = "Asia/Seoul")
	public void runAll() {
		int created = 0;
		for (User user : userRepository.findAll()) {
			created += generateFor(user.getId());
		}
		log.info("알림 생성 점검 완료: 새 알림 {}개", created);
	}

	/** 시세가 실제 값으로 갱신되면 바로 가격 변동·쏠림 조건을 점검 */
	@EventListener
	public void onMarketSynced(MarketSyncedEvent event) {
		runAll();
	}

	public int generateFor(Long userId) {
		return priceAndRisk(userId) + benefitDeadlines(userId);
	}

	private int priceAndRisk(Long userId) {
		var valuation = valuationService.valuate(userId);
		long investTotal = valuation.holdings().stream().mapToLong(PricedHolding::marketValue).sum();
		int created = 0;
		for (PricedHolding p : valuation.holdings()) {
			Instrument ins = p.instrument();
			Double pct = ins.getChangePercent();
			if (pct != null && Math.abs(pct) >= properties.priceChangePercent()) {
				String direction = pct > 0 ? "올랐어요" : "내렸어요";
				if (notificationService.publish(userId, Type.PRICE_CHANGE,
						"%s 주가가 %.1f%% %s".formatted(ins.getName(), Math.abs(pct), direction),
						"%s 종가 기준 %s원이에요. 보유 종목의 변동을 확인해 보세요.".formatted(ins.getQuoteDate(),
								String.format("%,d", ins.getPrice())),
						TargetType.INSTRUMENT, ins.getId(), "PRICE:%s:%s".formatted(ins.getId(), ins.getQuoteDate()))) {
					created++;
				}
			}
			double weight = Numbers.weight(p.marketValue(), investTotal);
			if (valuation.holdings().size() > 1 && weight >= properties.concentrationPercent()) {
				LocalDate today = LocalDate.now(clock);
				String week = today.get(IsoFields.WEEK_BASED_YEAR) + "W" + today.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
				if (notificationService.publish(userId, Type.PORTFOLIO_RISK,
						"투자자산의 %.1f%%가 %s 한 종목이에요".formatted(weight, ins.getName()),
						"한 종목 비중이 높으면 가격 변동의 영향을 크게 받을 수 있어요. 자산 배분을 살펴보세요.",
						TargetType.ASSET, null, "RISK:%s:%s".formatted(ins.getId(), week))) {
					created++;
				}
			}
		}
		return created;
	}

	private int benefitDeadlines(Long userId) {
		LocalDate today = LocalDate.now(clock);
		int created = 0;
		for (Benefit b : benefitRepository.findByDeadlineBetween(today, today.plusDays(properties.benefitDeadlineDays()))) {
			long days = ChronoUnit.DAYS.between(today, b.getDeadline());
			String dday = days == 0 ? "오늘" : "D-" + days;
			if (notificationService.publish(userId, Type.BENEFIT_DEADLINE,
					"%s 신청 마감 %s".formatted(b.getTitle(), dday),
					"%s까지 신청할 수 있어요. 자격 조건은 공식 안내에서 확인해 주세요.".formatted(b.getDeadline()),
					TargetType.BENEFIT, b.getId(), "BENEFIT:%s:%s".formatted(b.getId(), b.getDeadline()))) {
				created++;
			}
		}
		return created;
	}
}
