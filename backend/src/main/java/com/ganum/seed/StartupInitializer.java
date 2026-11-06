package com.ganum.seed;

import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.stereotype.Component;

import com.ganum.asset.AssetSeeder;
import com.ganum.market.MarketSeeder;
import com.ganum.notification.NotificationSeeder;
import com.ganum.report.ReportRecovery;

/**
 * 시작 데이터 준비를 순서대로 실행합니다.
 * ApplicationRunner 는 HTTP 포트가 열린 뒤에 돌아서, 시드가 끝나기 전에 요청이 들어올 수 있었어요.
 * SmartInitializingSingleton 은 웹 서버가 시작되기 전에 실행되므로, 요청을 받을 때는 항상 데이터가 준비돼 있습니다.
 */
@Component
class StartupInitializer implements SmartInitializingSingleton {

	private final DemoDataSeeder demoDataSeeder;
	private final MarketSeeder marketSeeder;
	private final AssetSeeder assetSeeder;
	private final NotificationSeeder notificationSeeder;
	private final ReportRecovery reportRecovery;

	StartupInitializer(DemoDataSeeder demoDataSeeder, MarketSeeder marketSeeder, AssetSeeder assetSeeder,
			NotificationSeeder notificationSeeder, ReportRecovery reportRecovery) {
		this.demoDataSeeder = demoDataSeeder;
		this.marketSeeder = marketSeeder;
		this.assetSeeder = assetSeeder;
		this.notificationSeeder = notificationSeeder;
		this.reportRecovery = reportRecovery;
	}

	@Override
	public void afterSingletonsInstantiated() {
		demoDataSeeder.seed(); // 사용자 → 종목 → 자산(종목 시세 필요) → 알림(자산·혜택 필요) 순서
		marketSeeder.seed();
		assetSeeder.seed();
		notificationSeeder.seed();
		reportRecovery.recover();
	}
}
