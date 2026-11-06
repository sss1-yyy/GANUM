package com.ganum.asset;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 하루 한 번 저장하는 자산 총액 기록 (ASSET-04 추이, ASSET-01 월간 변화 계산용). */
@Entity
@Table(name = "asset_snapshots", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "snapshot_date" }))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AssetSnapshot {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "snapshot_date", nullable = false)
	private LocalDate date;

	@Column(nullable = false)
	private long totalAssets;

	@Column(nullable = false)
	private long totalDebt;

	public AssetSnapshot(Long userId, LocalDate date, long totalAssets, long totalDebt) {
		this.userId = userId;
		this.date = date;
		this.totalAssets = totalAssets;
		this.totalDebt = totalDebt;
	}

	public void update(long totalAssets, long totalDebt) {
		this.totalAssets = totalAssets;
		this.totalDebt = totalDebt;
	}

	public long getNetAssets() {
		return totalAssets - totalDebt;
	}
}
