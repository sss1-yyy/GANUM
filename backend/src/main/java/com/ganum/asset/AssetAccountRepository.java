package com.ganum.asset;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetAccountRepository extends JpaRepository<AssetAccount, Long> {

	List<AssetAccount> findByUserIdOrderByIdAsc(Long userId);

	boolean existsByUserId(Long userId);
}