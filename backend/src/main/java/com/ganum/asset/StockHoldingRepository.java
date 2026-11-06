package com.ganum.asset;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface StockHoldingRepository extends JpaRepository<StockHolding, Long> {

	List<StockHolding> findByUserIdOrderByIdAsc(Long userId);

	List<StockHolding> findByInstrumentId(String instrumentId);
}