package com.ganum.common.api;

import java.time.OffsetDateTime;

/** 자산·시세·분석 응답에 붙는 데이터 출처 정보. asOf 를 모르면 null. */
public record Meta(DataSource source, OffsetDateTime asOf) {

	public enum DataSource {
		MOCK, LIVE, MIXED
	}
}
