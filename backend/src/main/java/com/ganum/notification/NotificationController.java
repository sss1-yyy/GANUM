package com.ganum.notification;

import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ganum.common.api.ApiResponse;
import com.ganum.common.api.ListData;
import com.ganum.common.auth.CurrentUserId;
import com.ganum.notification.dto.NotificationResponse;
import com.ganum.notification.dto.ReadRequest;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

	private final NotificationService notificationService;

	public NotificationController(NotificationService notificationService) {
		this.notificationService = notificationService;
	}

	/** NOTI-01 · 인앱 알림 목록 */
	@GetMapping
	public ApiResponse<ListData<NotificationResponse>> list(@CurrentUserId Long userId,
			@RequestParam(defaultValue = "false") boolean unreadOnly,
			@RequestParam(required = false) String cursor,
			@RequestParam(required = false) Integer limit) {
		return ApiResponse.of(notificationService.list(userId, unreadOnly, cursor, limit));
	}

	/** NOTI-02 · 알림 읽음 처리 */
	@PatchMapping("/{notificationId}")
	public ApiResponse<NotificationResponse> read(@CurrentUserId Long userId, @PathVariable String notificationId,
			@Validated @RequestBody ReadRequest request) {
		return ApiResponse.of(notificationService.markRead(userId, notificationId));
	}
}
