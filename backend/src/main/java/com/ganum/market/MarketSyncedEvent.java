package com.ganum.market;

/** 시세 동기화가 끝나고 LIVE 로 갱신된 종목이 1개 이상일 때 발행됩니다. (알림 점검이 구독) */
public record MarketSyncedEvent(int updatedCount) {
}
