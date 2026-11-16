package com.ganum.asset;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetSnapshotRepository extends JpaRepository<AssetSnapshot, Long> {

	List<AssetSnapshot> findByUserIdAndDateBetweenOrderByDateAsc(Long userId, LocalDate from, LocalDate to);

	Optional<AssetSnapshot> findByUserIdAndDate(Long userId, LocalDate date);

	/** 기준일 이하의 가장 최근 기록 */
	Optional<AssetSnapshot> findFirstByUserIdAndDateLessThanEqualOrderByDateDesc(Long userId, LocalDate date);

	boolean existsByUserId(Long userId);
}