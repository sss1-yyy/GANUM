package com.ganum.asset.dto;

import java.time.LocalDate;

/** ASSET-04 자산 추이 항목 */
public record AssetHistoryPoint(LocalDate date, long totalAssets, long totalDebt, long netAssets) {
}
