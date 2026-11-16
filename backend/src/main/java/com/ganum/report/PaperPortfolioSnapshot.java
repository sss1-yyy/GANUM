package com.ganum.report;

import java.util.List;

/**
 * 모의투자는 목데이터 범위라 서버에 계좌가 없습니다. PAPER 레포트 입력용으로
 * 프론트 목데이터(frontend/src/mocks/shared/paper.ts)의 시작 상태를 그대로 옮긴 값입니다.
 * 모의투자를 실구현하면 이 클래스를 실제 계좌 조회로 바꾸면 됩니다.
 */
final class PaperPortfolioSnapshot {

	static final long INITIAL_BALANCE = 17_746_000;
	static final long CASH_BALANCE = 10_034_002;
	static final List<Position> POSITIONS = List.of(
			new Position("ins_005930", 11, 272_000),
			new Position("ins_000660", 2, 1_833_600),
			new Position("ins_069500", 5, 285_700));

	private PaperPortfolioSnapshot() {
	}

	record Position(String instrumentId, long quantity, long averagePrice) {
	}
}
