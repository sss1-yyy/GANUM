package com.ganum.market;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface DailyPriceRepository extends JpaRepository<DailyPrice, Long> {

	List<DailyPrice> findByInstrumentIdAndDateBetweenOrderByDateAsc(String instrumentId, LocalDate from,
			LocalDate to);

	/** 기준일 이전(미포함)의 가장 최근 거래일 종가 — 가격 변동 알림에 사용 */
	Optional<DailyPrice> findFirstByInstrumentIdAndDateBeforeOrderByDateDesc(String instrumentId, LocalDate date);

	boolean existsByInstrumentId(String instrumentId);

	@Modifying
	@Query("delete from DailyPrice p where p.instrumentId = :instrumentId")
	void deleteAllByInstrumentId(String instrumentId);
}
