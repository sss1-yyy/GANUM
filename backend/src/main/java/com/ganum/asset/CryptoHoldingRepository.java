package com.ganum.asset;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CryptoHoldingRepository extends JpaRepository<CryptoHolding, Long> {

	List<CryptoHolding> findByUserIdOrderByIdAsc(Long userId);
}