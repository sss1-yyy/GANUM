package com.ganum.usage;

import java.util.Arrays;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ganum.common.error.ApiException;
import com.ganum.common.error.ErrorCode;
import com.ganum.common.time.Times;
import com.ganum.usage.dto.UsageResponse;

@Service
public class UsageService {

	private final UsageAccountRepository repository;
	private final UsageProperties properties;

	public UsageService(UsageAccountRepository repository, UsageProperties properties) {
		this.repository = repository;
		this.properties = properties;
	}

	@Transactional(readOnly = true)
	public UsageResponse getUsage(Long userId) {
		UsageAccount account = find(userId);
		return new UsageResponse(
				account.getPlan().name(),
				account.getTokenBalance(),
				account.getTokensGranted(),
				account.getTokensUsed(),
				Times.toKst(account.getResetsAt()),
				Arrays.stream(UsageFeature.values())
						.map(f -> new UsageResponse.Cost(f.name(), properties.costOf(f)))
						.toList());
	}

	/** 토큰을 차감하고 차감한 수를 돌려줍니다. 부족하면 409 TOKEN_INSUFFICIENT. */
	@Transactional
	public int charge(Long userId, UsageFeature feature) {
		int cost = properties.costOf(feature);
		if (!find(userId).tryCharge(cost)) {
			throw new ApiException(ErrorCode.TOKEN_INSUFFICIENT);
		}
		return cost;
	}

	/** 생성 실패 시 이미 차감한 토큰을 되돌립니다. */
	@Transactional
	public void refund(Long userId, int tokens) {
		find(userId).refund(tokens);
	}

	@Transactional(readOnly = true)
	public boolean hasEnough(Long userId, UsageFeature feature) {
		return find(userId).getTokenBalance() >= properties.costOf(feature);
	}

	private UsageAccount find(Long userId) {
		return repository.findById(userId)
				.orElseThrow(() -> new ApiException(ErrorCode.INTERNAL_ERROR, "이용권 정보가 없어요."));
	}
}
