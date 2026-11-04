package com.ganum.asset;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ganum.common.Numbers;
import com.ganum.common.api.Meta;
import com.ganum.common.api.Meta.DataSource;
import com.ganum.market.Instrument;
import com.ganum.market.InstrumentRepository;
import com.ganum.market.MarketService;
import com.ganum.user.FinancialProfile;
import com.ganum.user.FinancialProfileRepository;

/**
 * 사용자의 실제 자산을 현재 시세로 평가합니다. (요약·보유목록·스냅샷·레포트가 함께 사용)
 * 모의투자 자산은 절대 합산하지 않습니다.
 */
@Service
@Transactional(readOnly = true)
public class AssetValuationService {

	private final AssetAccountRepository accountRepository;
	private final StockHoldingRepository stockHoldingRepository;
	private final CryptoHoldingRepository cryptoHoldingRepository;
	private final InstrumentRepository instrumentRepository;
	private final FinancialProfileRepository financialProfileRepository;
	private final UpbitPriceClient upbit;
	private final Clock clock;

	public AssetValuationService(AssetAccountRepository accountRepository,
			StockHoldingRepository stockHoldingRepository, CryptoHoldingRepository cryptoHoldingRepository,
			InstrumentRepository instrumentRepository, FinancialProfileRepository financialProfileRepository,
			UpbitPriceClient upbit, Clock clock) {
		this.accountRepository = accountRepository;
		this.stockHoldingRepository = stockHoldingRepository;
		this.cryptoHoldingRepository = cryptoHoldingRepository;
		this.instrumentRepository = instrumentRepository;
		this.financialProfileRepository = financialProfileRepository;
		this.upbit = upbit;
		this.clock = clock;
	}

	public Valuation valuate(Long userId) {
		Map<AssetCategory, Long> byCategory = new EnumMap<>(AssetCategory.class);
		Set<DataSource> sources = new LinkedHashSet<>();
		OffsetDateTime now = OffsetDateTime.now(clock);
		OffsetDateTime oldest = null;

		List<AssetAccount> accounts = accountRepository.findByUserIdOrderByIdAsc(userId);
		for (AssetAccount a : accounts) {
			byCategory.merge(a.getCategory(), a.getBalance(), Long::sum);
		}
		if (!accounts.isEmpty()) {
			sources.add(DataSource.MOCK); // 계좌 잔액은 연동처 미정 → 시드 값
		}

		// 주식·ETF: 종목 시세로 평가
		List<StockHolding> holdings = stockHoldingRepository.findByUserIdOrderByIdAsc(userId);
		Map<String, Instrument> instruments = instrumentRepository
				.findAllById(holdings.stream().map(StockHolding::getInstrumentId).toList()).stream()
				.collect(Collectors.toMap(Instrument::getId, Function.identity()));
		List<PricedHolding> priced = new ArrayList<>();
		for (StockHolding h : holdings) {
			Instrument ins = instruments.get(h.getInstrumentId());
			if (ins == null) {
				continue;
			}
			long marketValue = Numbers.roundWon(h.getQuantity().multiply(BigDecimal.valueOf(ins.getPrice())));
			priced.add(new PricedHolding(h, ins, marketValue));
			byCategory.merge(ins.getType() == Instrument.Type.ETF ? AssetCategory.ETF : AssetCategory.STOCK,
					marketValue, Long::sum);
			sources.add(ins.getQuoteSource());
			OffsetDateTime asOf = MarketService.asOf(ins.getQuoteDate());
			oldest = oldest == null || asOf.isBefore(oldest) ? asOf : oldest;
		}

		// 코인: 업비트 현재가, 실패 시 시드 가격
		List<CryptoHolding> coins = cryptoHoldingRepository.findByUserIdOrderByIdAsc(userId);
		Map<String, UpbitPriceClient.Ticker> tickers = upbit.tickers(coins.stream().map(CryptoHolding::getSymbol).toList());
		List<PricedCoin> pricedCoins = new ArrayList<>();
		for (CryptoHolding c : coins) {
			UpbitPriceClient.Ticker live = tickers.get(c.getSymbol());
			long price = live != null ? live.price() : c.getFallbackPrice();
			double changePercent = live != null ? live.changePercent() : c.getFallbackChangePercent();
			sources.add(live != null ? DataSource.LIVE : DataSource.MOCK);
			long amount = Numbers.roundWon(c.getQuantity().multiply(BigDecimal.valueOf(price)));
			pricedCoins.add(new PricedCoin(c, amount, changePercent));
			byCategory.merge(AssetCategory.CRYPTO, amount, Long::sum);
		}

		long totalAssets = byCategory.values().stream().mapToLong(Long::longValue).sum();
		long totalDebt = financialProfileRepository.findById(userId)
				.map(FinancialProfile::getDebtAmount).map(d -> d == null ? 0L : d).orElse(0L);
		boolean connected = !accounts.isEmpty() || !holdings.isEmpty() || !coins.isEmpty();

		DataSource source = sources.isEmpty() ? DataSource.MOCK
				: sources.size() == 1 ? sources.iterator().next() : DataSource.MIXED;
		return new Valuation(byCategory, accounts, priced, pricedCoins, totalAssets, totalDebt, connected,
				new Meta(source, oldest != null ? oldest : now));
	}

	public record PricedHolding(StockHolding holding, Instrument instrument, long marketValue) {
	}

	/** amount: 평가금액(원), changePercent: 24시간 등락률(%) */
	public record PricedCoin(CryptoHolding holding, long amount, double changePercent) {
	}

	public record Valuation(Map<AssetCategory, Long> byCategory, List<AssetAccount> accounts,
			List<PricedHolding> holdings, List<PricedCoin> coins, long totalAssets, long totalDebt, boolean connected,
			Meta meta) {

		public long netAssets() {
			return totalAssets - totalDebt;
		}
	}
}
