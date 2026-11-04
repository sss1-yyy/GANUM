package com.ganum.user;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ganum.common.api.ApiResponse;
import com.ganum.common.auth.CurrentUserId;
import com.ganum.common.error.ApiException;
import com.ganum.usage.UsageService;
import com.ganum.usage.dto.UsageResponse;
import com.ganum.user.dto.MeResponse;

@RestController
@RequestMapping("/api/v1/me")
public class MeController {

	private final UserRepository userRepository;
	private final FinancialProfileRepository financialProfileRepository;
	private final UsageService usageService;

	public MeController(UserRepository userRepository, FinancialProfileRepository financialProfileRepository,
			UsageService usageService) {
		this.userRepository = userRepository;
		this.financialProfileRepository = financialProfileRepository;
		this.usageService = usageService;
	}

	/** USER-01 · 내 사용자 정보 */
	@GetMapping
	@Transactional(readOnly = true)
	public ApiResponse<MeResponse> me(@CurrentUserId Long userId) {
		User user = userRepository.findById(userId).orElseThrow(ApiException::notFound);
		boolean onboarded = financialProfileRepository.findById(userId)
				.map(FinancialProfile::isOnboardingCompleted)
				.orElse(false);
		return ApiResponse.of(new MeResponse(String.valueOf(user.getId()), user.getNickname(), onboarded));
	}

	/** USAGE-01 · 플랜·잔여 이용량 */
	@GetMapping("/usage")
	public ApiResponse<UsageResponse> usage(@CurrentUserId Long userId) {
		return ApiResponse.of(usageService.getUsage(userId));
	}
}
