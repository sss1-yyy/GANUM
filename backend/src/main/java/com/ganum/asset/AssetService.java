package com.ganum.asset;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ganum.common.Numbers;
import com.ganum.common.api.ListData;
import com.ganum.common.api.Meta;
import com.ganum.common.api.OffsetCursor;
import com.ganum.common.error.ApiException;
import com.ganum.asset.AssetValuationService.PricedHolding;
import com.ganum.asset.AssetValuationService.Valuation;
import com.ganum.asset.dto.AssetDetailDtos;
import com.ganum.asset.dto.AssetHistoryPoint;
import com.ganum.asset.dto.AssetSummaryResponse;
import com.ganum.asset.dto.HoldingItem;

@Service
@Transactional(readOnly = true)
public class AssetService {

	private static final int MAX_HISTORY_DAYS = 366;

	private final AssetValuationService valuationService;
	private final AssetSnapshotRepository snapshotRepository;
	private final Clock clock;

	public AssetService(AssetValuationService valuationService, AssetSnapshotRepository snapshotRepository,
			Clock clock) {
		this.valuationService = valuationService;
		this.snapshotRepository = snapshotRepository;
		this.clock = clock;
	}

	/** ASSET-01 */
	public Result<AssetSummaryResponse> summary(Long userId) {
		Valuation v = valuationService.valuate(userId);
		List<AssetSummaryResponse.Category> categories = new ArrayList<>();
		for (Map.Entry<AssetCategory, Long> e : v.byCategory().entrySet()) {
			if (e.getValue() > 0) {
				categories.add(new AssetSummaryResponse.Category(e.getKey().name(), e.getValue(),
						Numbers.weight(e.getValue(), v.totalAssets())));
			}
		}
		categories.sort((a, b) -> Long.compare(b.amount(), a.amount()));

		// 직전 월말 대비 순자산 변화
		LocalDate lastMonthEnd = LocalDate.now(clock).withDayOfMonth(1).minusDays(1);
		Long changeAmount = null;
		Double changePercent = null;
		var previous = snapshotRepository.findFirstByUserIdAndDateLessThanEqualOrderByDateDesc(userId, lastMonthEnd);
		if (previous.isPresent() && v.connected()) {
			long prevNet = previous.get().getNetAssets();
			changeAmount = v.netAssets() - prevNet;
			changePercent = Numbers.percent(changeAmount, prevNet); // 직전 순자산 0 이하면 null
		}
		return new Result<>(new AssetSummaryResponse(v.totalAssets(), v.totalDebt(), v.netAssets(), changeAmount,
				changePercent, categories, v.connected() ? "CONNECTED" : "NOT_CONNECTED"), v.meta());
	}

	/** ASSET-03 */
	public Result<ListData<HoldingItem>> holdings(Long userId, String cursor, Integer limit) {
		Valuation v = valuationService.valuate(userId);
		long investTotal = v.holdings().stream().mapToLong(PricedHolding::marketValue).sum();
		List<HoldingItem> items = v.holdings().stream().map(p -> toItem(p, investTotal)).toList();
		return new Result<>(OffsetCursor.page(items, cursor, limit), v.meta());
	}

	private static HoldingItem toItem(PricedHolding p, long investTotal) {
		BigDecimal avg = p.holding().getAveragePrice();
		Long profitLoss = null;
		Double profitLossPercent = null;
		if (avg != null) {
			long cost = Numbers.roundWon(avg.multiply(p.holding().getQuantity()));
			profitLoss = p.marketValue() - cost;
			profitLossPercent = Numbers.percent(profitLoss, cost); // 매입원가 0 이면 null
		}
		return new HoldingItem(p.instrument().getId(), p.instrument().getName(),
				Numbers.plain(p.holding().getQuantity()), Numbers.plain(avg), p.instrument().getPrice(),
				p.marketValue(), profitLoss, profitLossPercent, Numbers.weight(p.marketValue(), investTotal));
	}

	/** [명세 외] 계좌 목록: 입출금 계좌 + 증권 계좌(보유 종목 평가액 합계) 1개 */
	public Result<AssetDetailDtos.Accounts> accounts(Long userId) {
		Valuation v = valuationService.valuate(userId);
		List<AssetDetailDtos.Account> items = new ArrayList<>();
		v.accounts().stream().filter(a -> a.getCategory() == AssetCategory.CASH)
				.forEach(a -> items.add(new AssetDetailDtos.Account(String.valueOf(a.getId()), a.getInstitution(),
						a.getName(), a.getBalance(), "CASH")));
		if (!v.holdings().isEmpty()) {
			long brokerage = v.holdings().stream().mapToLong(PricedHolding::marketValue).sum();
			items.add(new AssetDetailDtos.Account("brokerage", "증권", "종합매매 계좌", brokerage, "STOCK"));
		}
		return new Result<>(new AssetDetailDtos.Accounts(items), v.meta());
	}

	/** [명세 외] 예적금 상세. 카테고리별 과거 기록은 없어 monthlyChangeAmount 는 null */
	public Result<AssetDetailDtos.CategoryDetail<AssetDetailDtos.Savings>> savings(Long userId) {
		Valuation v = valuationService.valuate(userId);
		List<AssetDetailDtos.Savings> items = v.accounts().stream()
				.filter(a -> a.getCategory() == AssetCategory.DEPOSIT)
				.map(a -> new AssetDetailDtos.Savings(String.valueOf(a.getId()), a.getName(), a.getBalance(),
						a.getInterestRate(), a.getTermMonths(), a.getMonthlyDeposit()))
				.toList();
		long total = items.stream().mapToLong(AssetDetailDtos.Savings::balance).sum();
		return new Result<>(new AssetDetailDtos.CategoryDetail<>(total, null, items), v.meta());
	}

	/** [명세 외] 코인 상세. 평가금액·등락률은 업비트 시세(실패 시 시드 값) */
	public Result<AssetDetailDtos.CategoryDetail<AssetDetailDtos.Crypto>> crypto(Long userId) {
		Valuation v = valuationService.valuate(userId);
		List<AssetDetailDtos.Crypto> items = v.coins().stream()
				.map(c -> new AssetDetailDtos.Crypto(c.holding().getSymbol().toLowerCase(java.util.Locale.ROOT),
						c.holding().getName(), c.holding().getSymbol(), Numbers.plain(c.holding().getQuantity()),
						c.amount(), c.changePercent()))
				.toList();
		long total = items.stream().mapToLong(AssetDetailDtos.Crypto::amount).sum();
		return new Result<>(new AssetDetailDtos.CategoryDetail<>(total, null, items), v.meta());
	}

	/** ASSET-04 */
	public Result<ListData<AssetHistoryPoint>> history(Long userId, LocalDate from, LocalDate to) {
		LocalDate today = LocalDate.now(clock);
		if (from.isAfter(to)) {
			throw ApiException.validation("to", "시작일 이후여야 해요.");
		}
		if (to.isAfter(today)) {
			throw ApiException.validation("to", "오늘 이하여야 해요.");
		}
		if (ChronoUnit.DAYS.between(from, to) > MAX_HISTORY_DAYS) {
			throw ApiException.validation("to", "기간은 최대 366일이에요.");
		}
		List<AssetHistoryPoint> items = new ArrayList<>(snapshotRepository
				.findByUserIdAndDateBetweenOrderByDateAsc(userId, from, to).stream()
				.filter(s -> !s.getDate().equals(today))
				.map(s -> new AssetHistoryPoint(s.getDate(), s.getTotalAssets(), s.getTotalDebt(), s.getNetAssets()))
				.toList());
		Valuation v = valuationService.valuate(userId);
		if (!to.isBefore(today) && v.connected()) {
			// 오늘은 저장된 기록 대신 현재 평가액 (요약과 숫자가 일치하도록)
			items.add(new AssetHistoryPoint(today, v.totalAssets(), v.totalDebt(), v.netAssets()));
		}
		return new Result<>(ListData.lastPage(items), v.meta());
	}

	public record Result<T>(T data, Meta meta) {
	}
}
